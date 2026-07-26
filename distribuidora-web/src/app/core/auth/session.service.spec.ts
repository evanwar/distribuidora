import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuthApiAdapter } from './auth-api.adapter';
import { SessionService } from './session.service';

const STORAGE_KEY = 'distribuidora.auth.session.v1';

describe('SessionService', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  it('uses browser-session storage unless the user chooses to remember the account', async () => {
    const accessToken = createToken({ exp: Math.floor(Date.now() / 1000) + 300 });
    const response = {
      accessToken,
      refreshToken: 'refresh-token',
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
    };
    const { session, api } = configureSession();
    api.login.mockReturnValue(of(response));

    await firstValueFrom(session.login({ username: 'caja', password: 'secret' }));

    expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    await firstValueFrom(
      session.login({ username: 'caja', password: 'secret' }, true),
    );

    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('secret');
    expect(session.rememberedUsername()).toBe('caja');
    expect(localStorage.getItem('distribuidora.auth.remembered-account.v1')).toBe('caja');
  });

  it('restores an active session after the application reloads', async () => {
    const accessToken = createToken({
      exp: Math.floor(Date.now() / 1000) + 300,
      name: 'Usuario de prueba',
      permission: ['sales.read'],
    });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        accessToken,
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 300_000,
      }),
    );

    const { session, api } = configureSession();

    expect(await firstValueFrom(session.ensureAuthenticated())).toBe(true);
    expect(session.identity()?.name).toBe('Usuario de prueba');
    expect(session.hasPermission('sales.read')).toBe(true);
    expect(api.refresh).not.toHaveBeenCalled();
  });

  it('refreshes an expired persisted session before authorizing navigation', async () => {
    const expiredToken = createToken({ exp: Math.floor(Date.now() / 1000) - 60 });
    const renewedToken = createToken({
      exp: Math.floor(Date.now() / 1000) + 300,
      name: 'Sesión renovada',
    });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        accessToken: expiredToken,
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 60_000,
      }),
    );
    const { session, api } = configureSession();
    api.refresh.mockReturnValue(
      of({
        accessToken: renewedToken,
        refreshToken: 'rotated-refresh-token',
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
      }),
    );

    expect(await firstValueFrom(session.ensureAuthenticated())).toBe(true);
    expect(session.accessToken()).toBe(renewedToken);
    expect(session.identity()?.name).toBe('Sesión renovada');
  });

  it('clears the persisted session when refresh is rejected', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        accessToken: createToken({ exp: Math.floor(Date.now() / 1000) - 60 }),
        refreshToken: 'invalid-refresh-token',
        expiresAt: Date.now() - 60_000,
      }),
    );
    const { session, api } = configureSession();
    api.refresh.mockReturnValue(throwError(() => new Error('Unauthorized')));

    expect(await firstValueFrom(session.ensureAuthenticated())).toBe(false);
    expect(session.authenticated()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

function configureSession(): {
  session: SessionService;
  api: {
    login: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
} {
  const api = {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
  };
  TestBed.configureTestingModule({
    providers: [{ provide: AuthApiAdapter, useValue: api }],
  });

  return { session: TestBed.inject(SessionService), api };
}

function createToken(payload: Record<string, unknown>): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.signature`;
}
