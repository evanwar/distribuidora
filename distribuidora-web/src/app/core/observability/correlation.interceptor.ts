import { HttpEventType, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { CORRELATION_ID_HEADER, OPERATION_ID_HEADER } from './observability.constants';
import { OPERATION_ID_CONTEXT } from './observability-context';
import { ResponseTraceService } from './response-trace.service';
import { TraceIdFactory } from './trace-id.factory';

export const correlationInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApiRequest(request.url)) return next(request);

  const ids = inject(TraceIdFactory);
  const traces = inject(ResponseTraceService);
  const requestedCorrelationId = request.headers.get(CORRELATION_ID_HEADER);
  const requestedOperationId =
    request.context.get(OPERATION_ID_CONTEXT) ?? request.headers.get(OPERATION_ID_HEADER);
  const correlationId = ids.isValid(requestedCorrelationId)
    ? requestedCorrelationId
    : ids.createCorrelationId();
  const operationId = ids.isValid(requestedOperationId)
    ? requestedOperationId
    : ids.createOperationId('WEB');
  const tracedRequest = request.clone({
    setHeaders: {
      [CORRELATION_ID_HEADER]: correlationId,
      [OPERATION_ID_HEADER]: operationId,
    },
  });

  return next(tracedRequest).pipe(
    tap((event) => {
      if (event.type !== HttpEventType.Response || !(event instanceof HttpResponse)) return;
      traces.capture({
        correlationId: event.headers.get(CORRELATION_ID_HEADER) ?? correlationId,
        operationId: event.headers.get(OPERATION_ID_HEADER) ?? operationId,
        method: tracedRequest.method,
        url: tracedRequest.urlWithParams,
        status: event.status,
        capturedAt: Date.now(),
      });
    }),
  );
};

function isApiRequest(url: string): boolean {
  try {
    const parsed = new URL(url, globalThis.location?.origin ?? 'http://localhost');
    return parsed.pathname === '/api' || parsed.pathname.startsWith('/api/');
  } catch {
    return url.startsWith('/api/');
  }
}
