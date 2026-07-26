import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { AuthApiAdapter } from './auth-api.adapter';
import { AuthResponse, LoginRequest, SessionIdentity } from './auth.models';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly authApi = inject(AuthApiAdapter);
  private readonly accessTokenState = signal<string | null>(null);
  private readonly refreshTokenState = signal<string | null>(null);
  private readonly expiresAtState = signal<number | null>(null);
  private readonly identityState = signal<SessionIdentity | null>(null);
  private readonly rememberedUsernameState = signal(readRememberedUsername());
  private persistence: SessionPersistence = 'session';
  private refreshInFlight?: Observable<string | null>;

  readonly accessToken = this.accessTokenState.asReadonly();
  readonly identity = this.identityState.asReadonly();
  readonly rememberedUsername = this.rememberedUsernameState.asReadonly();
  readonly authenticated = computed(() => Boolean(this.accessTokenState()));

  constructor() {
    this.restore();
  }

  login(request: LoginRequest, rememberAccount = false): Observable<void> {
    return this.authApi.login(request).pipe(
      tap((response) => {
        this.persistence = rememberAccount ? 'local' : 'session';
        this.rememberedUsernameState.set(rememberAccount ? request.username : '');
        writeRememberedUsername(rememberAccount ? request.username : null);
        this.accept(response, false);
      }),
      map(() => undefined),
    );
  }

  ensureAuthenticated(): Observable<boolean> {
    const accessToken = this.accessTokenState();
    if (accessToken && !this.isExpired(accessToken)) {
      return of(true);
    }

    if (!this.refreshTokenState()) {
      this.clear();
      return of(false);
    }

    return this.refresh().pipe(map((token) => Boolean(token)));
  }

  refresh(): Observable<string | null> {
    const refreshToken = this.refreshTokenState();
    if (!refreshToken) {
      return of(null);
    }

    if (!this.refreshInFlight) {
      this.refreshInFlight = this.authApi.refresh({ refreshToken }).pipe(
        tap((response) => this.accept(response, true)),
        map((response) => response.accessToken ?? null),
        catchError(() => {
          this.clear();
          return of(null);
        }),
        finalize(() => {
          this.refreshInFlight = undefined;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.refreshInFlight;
  }

  logout(): Observable<void> {
    const refreshToken = this.refreshTokenState();
    if (!refreshToken) {
      this.clear();
      return of(undefined);
    }

    return this.authApi.logout({ refreshToken }).pipe(
      catchError(() => of({})),
      tap(() => this.clear()),
      map(() => undefined),
    );
  }

  hasPermission(permission: string): boolean {
    const permissions = this.identityState()?.permissions ?? [];
    return permissions.includes('*') || permissions.includes(permission);
  }

  private accept(response: AuthResponse, preserveRefreshToken: boolean): void {
    const accessToken = response.accessToken ?? null;
    const refreshToken = preserveRefreshToken
      ? (response.refreshToken ?? this.refreshTokenState())
      : (response.refreshToken ?? null);

    this.accessTokenState.set(accessToken);
    this.refreshTokenState.set(refreshToken);
    this.expiresAtState.set(resolveExpiration(response.expiresAt, accessToken));
    this.identityState.set(accessToken ? parseIdentity(accessToken) : null);
    this.persist();
  }

  private clear(): void {
    this.accessTokenState.set(null);
    this.refreshTokenState.set(null);
    this.expiresAtState.set(null);
    this.identityState.set(null);
    removePersistedSession();
  }

  private restore(): void {
    const restored = readPersistedSession();
    if (!restored) {
      return;
    }

    const { session: persisted, persistence } = restored;
    this.persistence = persistence;
    this.refreshTokenState.set(persisted.refreshToken);
    this.expiresAtState.set(persisted.expiresAt);

    if (persisted.accessToken && !this.isExpired(persisted.accessToken)) {
      this.accessTokenState.set(persisted.accessToken);
      this.identityState.set(parseIdentity(persisted.accessToken));
    }
  }

  private isExpired(accessToken: string): boolean {
    const expiresAt = this.expiresAtState() ?? resolveExpiration(undefined, accessToken);
    return expiresAt !== null && expiresAt <= Date.now();
  }

  private persist(): void {
    const refreshToken = this.refreshTokenState();
    if (!refreshToken) {
      removePersistedSession();
      return;
    }

    writePersistedSession(
      {
        accessToken: this.accessTokenState(),
        refreshToken,
        expiresAt: this.expiresAtState(),
      },
      this.persistence,
    );
  }
}

const AUTH_STORAGE_KEY = 'distribuidora.auth.session.v1';
const REMEMBERED_ACCOUNT_KEY = 'distribuidora.auth.remembered-account.v1';
type SessionPersistence = 'session' | 'local';

interface PersistedSession {
  accessToken: string | null;
  refreshToken: string;
  expiresAt: number | null;
}

interface RestoredSession {
  session: PersistedSession;
  persistence: SessionPersistence;
}

function readPersistedSession(): RestoredSession | null {
  for (const persistence of ['local', 'session'] as const) {
    try {
      const value = getStorage(persistence)?.getItem(AUTH_STORAGE_KEY);
      if (!value) {
        continue;
      }

      const session = JSON.parse(value) as Partial<PersistedSession>;
      if (typeof session.refreshToken !== 'string' || !session.refreshToken) {
        getStorage(persistence)?.removeItem(AUTH_STORAGE_KEY);
        continue;
      }

      return {
        persistence,
        session: {
          accessToken: typeof session.accessToken === 'string' ? session.accessToken : null,
          refreshToken: session.refreshToken,
          expiresAt: typeof session.expiresAt === 'number' ? session.expiresAt : null,
        },
      };
    } catch {
      try {
        getStorage(persistence)?.removeItem(AUTH_STORAGE_KEY);
      } catch {
        // Continúa con el otro almacenamiento si el navegador bloquea este.
      }
    }
  }

  return null;
}

function writePersistedSession(
  session: PersistedSession,
  persistence: SessionPersistence,
): void {
  try {
    getStorage(persistence)?.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    getStorage(persistence === 'local' ? 'session' : 'local')?.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // La sesión continúa en memoria cuando el navegador bloquea el almacenamiento.
  }
}

function removePersistedSession(): void {
  for (const persistence of ['local', 'session'] as const) {
    try {
      getStorage(persistence)?.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // No hay nada adicional que limpiar si el almacenamiento no está disponible.
    }
  }
}

function getStorage(persistence: SessionPersistence): Storage | undefined {
  return persistence === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
}

function readRememberedUsername(): string {
  try {
    return globalThis.localStorage?.getItem(REMEMBERED_ACCOUNT_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

function writeRememberedUsername(username: string | null): void {
  try {
    if (username) {
      globalThis.localStorage?.setItem(REMEMBERED_ACCOUNT_KEY, username);
    } else {
      globalThis.localStorage?.removeItem(REMEMBERED_ACCOUNT_KEY);
    }
  } catch {
    // Recordar la cuenta es opcional si el navegador bloquea el almacenamiento.
  }
}

function resolveExpiration(expiresAt: string | undefined, token: string | null): number | null {
  if (expiresAt) {
    const parsed = Date.parse(expiresAt);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const expirationClaim = readJwtPayload(token)?.['exp'];
  return typeof expirationClaim === 'number' ? expirationClaim * 1000 : null;
}

function parseIdentity(token: string): SessionIdentity {
  const payload = readJwtPayload(token);
  if (payload) {
    const permissionClaim = payload['permission'] ?? payload['permissions'];
    const permissions = Array.isArray(permissionClaim)
      ? permissionClaim.map(String)
      : permissionClaim
        ? [String(permissionClaim)]
        : [];
    return {
      name: String(payload['name'] ?? payload['unique_name'] ?? payload['sub'] ?? 'Usuario'),
      username: String(payload['preferred_username'] ?? payload['sub'] ?? ''),
      permissions,
    };
  }

  return { name: 'Usuario', username: '', permissions: [] };
}

function readJwtPayload(token: string | null): Record<string, unknown> | null {
  try {
    const encoded = token?.split('.')[1];
    if (!encoded) {
      return null;
    }

    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}
