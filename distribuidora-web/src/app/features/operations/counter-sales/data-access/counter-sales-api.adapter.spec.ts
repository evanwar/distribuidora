import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CounterSalesApiAdapter } from './counter-sales-api.adapter';

describe('CounterSalesApiAdapter payment terminal contract', () => {
  let adapter: CounterSalesApiAdapter;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CounterSalesApiAdapter, provideHttpClient(), provideHttpClientTesting()],
    });
    adapter = TestBed.inject(CounterSalesApiAdapter);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends the selected managed terminal when starting a Point payment', () => {
    adapter.startCardPayment('sale-1', 125.5, 'terminal-2').subscribe((payment) => {
      expect(payment.paymentTerminalId).toBe('terminal-2');
    });

    const request = http.expectOne('/api/v1/counter-sales/sale-1/card-payment');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ amount: 125.5, paymentTerminalId: 'terminal-2' });
    request.flush({
      success: true,
      data: {
        id: 'point-1',
        saleId: 'sale-1',
        paymentTerminalId: 'terminal-2',
        orderId: 'ORD-1',
        amount: 125.5,
        status: 'Pending',
        statusDetail: 'created',
      },
    });
  });
});
