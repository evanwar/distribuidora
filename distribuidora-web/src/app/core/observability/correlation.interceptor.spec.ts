import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { correlationInterceptor } from './correlation.interceptor';
import { CORRELATION_ID_HEADER, OPERATION_ID_HEADER } from './observability.constants';
import { withOperationId } from './observability-context';
import { ResponseTraceService } from './response-trace.service';
import { HttpClient } from '@angular/common/http';

describe('correlationInterceptor', () => {
  it('adds a unique correlation and the explicit operation to API requests', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([correlationInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    const traces = TestBed.inject(ResponseTraceService);

    http.get('/api/v1/products', { context: withOperationId('INV-operation-1') }).subscribe();
    const request = controller.expectOne('/api/v1/products');
    const correlationId = request.request.headers.get(CORRELATION_ID_HEADER);
    expect(correlationId).toMatch(/^WEB-/);
    expect(request.request.headers.get(OPERATION_ID_HEADER)).toBe('INV-operation-1');
    request.flush({}, { headers: { [CORRELATION_ID_HEADER]: correlationId! } });

    expect(traces.lastTrace()?.correlationId).toBe(correlationId);
    expect(traces.lastTrace()?.operationId).toBe('INV-operation-1');
    controller.verify();
  });

  it('does not add trace headers to non API resources', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([correlationInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);

    http.get('/assets/config.json').subscribe();
    const request = controller.expectOne('/assets/config.json');
    expect(request.request.headers.has(CORRELATION_ID_HEADER)).toBe(false);
    request.flush({});
    controller.verify();
  });
});
