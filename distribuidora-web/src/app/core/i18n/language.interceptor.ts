import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LanguageService } from './language.service';

export const languageInterceptor: HttpInterceptorFn = (request, next) => {
  const language = inject(LanguageService);
  return next(
    request.headers.has('Accept-Language')
      ? request
      : request.clone({ setHeaders: { 'Accept-Language': language.locale() } }),
  );
};
