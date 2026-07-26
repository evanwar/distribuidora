import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { SessionService } from './session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const token = session.accessToken();
  const authenticatedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? Number(error.status)
          : undefined;
      const isAuthEndpoint = request.url.includes('/api/v1/auth/');
      if (status !== 401 || isAuthEndpoint) {
        return throwError(() => error);
      }

      return session.refresh().pipe(
        switchMap((newToken) =>
          newToken
            ? next(request.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }))
            : throwError(() => error),
        ),
      );
    }),
  );
};
