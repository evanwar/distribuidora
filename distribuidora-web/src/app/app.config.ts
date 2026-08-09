import { registerLocaleData } from '@angular/common';
import localeEsMx from '@angular/common/locales/es-MX';
import localeEnUs from '@angular/common/locales/en';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { apiErrorInterceptor } from './core/error-handling/api-error.interceptor';
import { correlationInterceptor } from './core/observability/correlation.interceptor';
import { initialAppLocale } from './core/i18n/language.service';
import { languageInterceptor } from './core/i18n/language.interceptor';

registerLocaleData(localeEsMx);
registerLocaleData(localeEnUs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([languageInterceptor, correlationInterceptor, authInterceptor, apiErrorInterceptor]),
    ),
    provideRouter(routes),
    { provide: LOCALE_ID, useFactory: initialAppLocale },
  ],
};
