import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError, ApiErrorKind } from './api-error.model';

interface ErrorPayload {
  message?: string;
  errors?: string[] | Record<string, string[]>;
  correlationId?: string;
}

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const payload = (error.error ?? {}) as ErrorPayload;
      const fieldErrors =
        payload.errors && !Array.isArray(payload.errors) ? payload.errors : {};
      const message =
        payload.message ??
        (Array.isArray(payload.errors) ? payload.errors.join(', ') : undefined) ??
        statusMessage(error.status);

      const normalized: ApiError = {
        kind: statusKind(error.status),
        message,
        fieldErrors,
        status: error.status,
        correlationId: payload.correlationId,
        retryable: error.status === 0 || error.status >= 500,
      };

      return throwError(() => normalized);
    }),
  );

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

function statusMessage(status: number): string {
  const messages: Record<number, string> = {
    0: 'No fue posible conectar con el servidor.',
    401: 'La sesión terminó. Inicia sesión nuevamente.',
    403: 'No tienes permiso para realizar esta acción.',
    404: 'No encontramos el recurso solicitado.',
    409: 'La información cambió. Recarga y revisa antes de continuar.',
    422: 'Revisa la información capturada.',
    429: 'Hay demasiadas solicitudes. Intenta nuevamente en un momento.',
  };
  return messages[status] ?? 'Ocurrió un error inesperado.';
}
