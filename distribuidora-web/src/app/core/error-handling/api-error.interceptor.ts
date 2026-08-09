import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { LanguageService } from '../i18n/language.service';
import { ApiError, ApiErrorKind } from './api-error.model';
import {
  CORRELATION_ID_HEADER,
  OPERATION_ID_HEADER,
} from '../observability/observability.constants';

interface ErrorPayload {
  message?: string;
  errors?: string[] | Record<string, string[]>;
  correlationId?: string;
}

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const i18n = inject(LanguageService);
  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const payload = (error.error ?? {}) as ErrorPayload;
      const fieldErrors = payload.errors && !Array.isArray(payload.errors) ? payload.errors : {};
      const message =
        payload.message ??
        (Array.isArray(payload.errors) ? payload.errors.join(', ') : undefined) ??
        statusMessage(error.status, i18n);

      const normalized: ApiError = {
        kind: statusKind(error.status),
        message,
        fieldErrors,
        status: error.status,
        correlationId:
          payload.correlationId ??
          error.headers.get(CORRELATION_ID_HEADER) ??
          request.headers.get(CORRELATION_ID_HEADER) ??
          undefined,
        operationId:
          error.headers.get(OPERATION_ID_HEADER) ??
          request.headers.get(OPERATION_ID_HEADER) ??
          undefined,
        retryable: error.status === 0 || error.status >= 500,
      };

      return throwError(() => normalized);
    }),
  );
};

function statusKind(status: number): ApiErrorKind {
  if (status === 0) return 'network';
  if (status === 400 || status === 422) return 'validation';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate-limit';
  if (status >= 500) return 'server';
  return 'unexpected';
}

function statusMessage(status: number, i18n: LanguageService): string {
  const messages: Record<number, Parameters<LanguageService['translate']>[0]> = {
    0: 'error.network',
    401: 'error.session',
    403: 'error.forbidden',
    404: 'error.notFound',
    409: 'error.conflict',
    422: 'error.validation',
    429: 'error.rateLimit',
  };
  return i18n.translate(messages[status] ?? 'error.server');
}
