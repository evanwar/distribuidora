import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { languageInterceptor } from './language.interceptor';
import { LANGUAGE_RELOAD, LanguageService } from './language.service';

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
  });

  it('uses Spanish by default and persists an English selection', () => {
    const reload = vi.fn();
    TestBed.configureTestingModule({
      providers: [LanguageService, { provide: LANGUAGE_RELOAD, useValue: reload }],
    });
    const service = TestBed.inject(LanguageService);

    expect(service.language()).toBe('es');
    expect(service.locale()).toBe('es-MX');
    expect(document.documentElement.lang).toBe('es');

    service.setLanguage('en');

    expect(localStorage.getItem('distribuidora.language.v1')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(service.translate('login.signIn')).toBe('Sign in');
    expect(reload).toHaveBeenCalledOnce();
  });

  it('sends the selected locale to the API', () => {
    localStorage.setItem('distribuidora.language.v1', 'en');
    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: LANGUAGE_RELOAD, useValue: () => undefined },
        provideHttpClient(withInterceptors([languageInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);

    http.get('/api/v1/health').subscribe();
    const request = controller.expectOne('/api/v1/health');
    expect(request.request.headers.get('Accept-Language')).toBe('en-US');
    request.flush({});
    controller.verify();
  });
});
