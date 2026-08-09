import { TestBed } from '@angular/core/testing';
import { NEVER, of } from 'rxjs';
import { CounterSalesApiAdapter } from './counter-sales-api.adapter';
import { CounterSalesStore } from './counter-sales.store';

describe('CounterSalesStore inventory rules', () => {
  it('uses available stock and prevents adding more units than the warehouse has', () => {
    const store = configureStore();

    store.load();
    store.selectWarehouse('warehouse-1');
    store.add(product);
    store.changeQuantity(product.id, 99);

    expect(store.availableStock(product.id)).toBe(3);
    expect(store.lines()[0].quantity).toBe(3);
    expect(store.canAdd(product.id)).toBe(false);
    expect(store.hasValidStock()).toBe(true);
    expect(store.stockNotice()).toContain('Sólo hay 3 unidades disponibles');
  });

  it('removes unavailable lines when the source warehouse changes', () => {
    const store = configureStore();

    store.load();
    store.selectWarehouse('warehouse-1');
    store.add(product);
    store.selectWarehouse('warehouse-2');

    expect(store.lines()).toEqual([]);
    expect(store.hasValidStock()).toBe(true);
    expect(store.stockNotice()).toContain('Se ajustó el carrito');
  });

  it('adds all available stock in one action and replaces the current quantity', () => {
    const store = configureStore();

    store.load();
    store.selectWarehouse('warehouse-1');
    store.add(product);
    store.addAll(product);

    expect(store.lines()).toHaveLength(1);
    expect(store.lines()[0].quantity).toBe(3);
    expect(store.canAdd(product.id)).toBe(false);
  });

  it('searches customers by phone after the input debounce', async () => {
    vi.useFakeTimers();
    const { store, api } = configureStoreWithApi();

    store.searchCustomers('55 1234 5678');
    await vi.advanceTimersByTimeAsync(250);

    expect(api.searchCustomers).toHaveBeenCalledWith('55 1234 5678', expect.anything());
    expect(store.customers()).toEqual([
      {
        id: 'customer-1',
        name: 'Angeles Flores Sanchez',
        phone: '55 1234 5678',
        creditBlocked: false,
      },
    ]);
    vi.useRealTimers();
  });

  it('waits for Point approval before completing a card sale', async () => {
    vi.useFakeTimers();
    const { store, api } = configureStoreWithApi();
    const completed = vi.fn();

    store.saveCard(saleRequest, 'terminal-1', completed);
    await vi.advanceTimersByTimeAsync(0);

    expect(api.startCardPayment).toHaveBeenCalledWith(
      'sale-1',
      45.5,
      'terminal-1',
      expect.anything(),
    );
    expect(completed).toHaveBeenCalledWith(expect.objectContaining({ id: 'sale-1', status: 'Confirmed' }));
    expect(store.cardPayment()?.status).toBe('Approved');
    vi.useRealTimers();
  });

  it('cancels a pending Point order and preserves the sale draft', async () => {
    vi.useFakeTimers();
    const { store, api } = configureStoreWithApi();

    api.getCardPayment.mockReturnValueOnce(NEVER);
    store.saveCard(saleRequest, 'terminal-1', vi.fn());
    await vi.advanceTimersByTimeAsync(0);

    store.cancelCardPayment();

    expect(api.cancelCardPayment).toHaveBeenCalledWith('sale-1', expect.anything());
    expect(store.cardPayment()?.status).toBe('Cancelled');
    expect(store.notice()).toContain('terminal está disponible');
    vi.useRealTimers();
  });

  it('associates a fiscal recipient without changing the commercial sale customer', () => {
    const { store, api } = configureStoreWithApi();
    const confirmedPublicSale = {
      ...draftSaleFixture,
      status: 'Confirmed',
      customerId: null,
    };

    store.loadBillingEligibility(confirmedPublicSale, () => undefined);
    store.assignBillingRecipient(
      confirmedPublicSale,
      'customer-1',
      'El comprador regresó para solicitar su factura.',
      () => undefined,
    );

    expect(api.assignBillingRecipient).toHaveBeenCalledWith(
      'sale-1',
      expect.objectContaining({ customerId: 'customer-1', rowVersion: 0 }),
      expect.anything(),
    );
    expect(confirmedPublicSale.customerId).toBeNull();
    expect(store.billingEligibility()?.eligible).toBe(true);
  });
});

const product = {
  id: 'product-1',
  sku: 'ARZ-001',
  name: 'Arroz premium',
  barcode: '750000000001',
  price: 45.5,
};

function configureStore(): CounterSalesStore {
  return configureStoreWithApi().store;
}

function configureStoreWithApi(): {
  store: CounterSalesStore;
  api: {
    loadWorkspace: ReturnType<typeof vi.fn>;
    searchCustomers: ReturnType<typeof vi.fn>;
    startCardPayment: ReturnType<typeof vi.fn>;
    getCardPayment: ReturnType<typeof vi.fn>;
    cancelCardPayment: ReturnType<typeof vi.fn>;
    getBillingEligibility: ReturnType<typeof vi.fn>;
    assignBillingRecipient: ReturnType<typeof vi.fn>;
  };
} {
  const draftSale = draftSaleFixture;
  const api = {
    loadWorkspace: vi.fn().mockReturnValue(
      of({
        customers: [],
        products: [product],
        warehouses: [
          { id: 'warehouse-1', name: 'Principal' },
          { id: 'warehouse-2', name: 'Secundario' },
        ],
        paymentMethods: [],
        paymentTerminals: [
          { id: 'terminal-1', name: 'Mostrador principal', externalId: 'PAX_MAIN', isDefault: true },
        ],
        balances: [
          {
            warehouseId: 'warehouse-1',
            productId: product.id,
            quantity: 5,
            reservedQuantity: 2,
          },
        ],
        sales: [],
      }),
    ),
    searchCustomers: vi.fn().mockReturnValue(
      of([
        {
          id: 'customer-1',
          name: 'Angeles Flores Sanchez',
          phone: '55 1234 5678',
          creditBlocked: false,
        },
      ]),
    ),
    create: vi.fn().mockReturnValue(of(draftSale)),
    update: vi.fn().mockReturnValue(of(draftSale)),
    startCardPayment: vi.fn().mockReturnValue(
      of({
        id: 'point-1', saleId: 'sale-1', paymentTerminalId: 'terminal-1', orderId: 'ORD-1', amount: 45.5,
        status: 'Pending', statusDetail: 'created', paymentId: null,
        paymentMethodType: null, paymentMethodId: null, installments: null, completedAt: null,
      }),
    ),
    getCardPayment: vi.fn().mockReturnValue(
      of({
        id: 'point-1', saleId: 'sale-1', paymentTerminalId: 'terminal-1', orderId: 'ORD-1', amount: 45.5,
        status: 'Approved', statusDetail: 'accredited', paymentId: 'PAY-1',
        paymentMethodType: 'credit_card', paymentMethodId: 'visa', installments: 1,
        completedAt: '2026-08-01T12:00:10Z',
      }),
    ),
    cancelCardPayment: vi.fn().mockReturnValue(
      of({
        id: 'point-1', saleId: 'sale-1', paymentTerminalId: 'terminal-1', orderId: 'ORD-1', amount: 45.5,
        status: 'Cancelled', statusDetail: 'canceled_by_api', paymentId: null,
        paymentMethodType: null, paymentMethodId: null, installments: null,
        completedAt: '2026-08-01T12:00:05Z',
      }),
    ),
    getById: vi.fn().mockReturnValue(of({ ...draftSale, status: 'Confirmed', paidAmount: 45.5, balance: 0 })),
    getBillingEligibility: vi.fn()
      .mockReturnValueOnce(of({
        eligible: false, reasonCode: 'billing_recipient_required', requiredAction: 'assign_billing_recipient',
        saleId: 'sale-1', saleStatus: 'Confirmed', billingCustomerId: null,
        fiscalCoverageStatus: 'Uncovered', electronicInvoiceStatus: null, rowVersion: 0,
      }))
      .mockReturnValue(of({
        eligible: true, reasonCode: 'eligible', requiredAction: 'issue_invoice',
        saleId: 'sale-1', saleStatus: 'Confirmed', billingCustomerId: 'customer-1',
        fiscalCoverageStatus: 'ReservedForNominativeInvoice', electronicInvoiceStatus: null, rowVersion: 1,
      })),
    assignBillingRecipient: vi.fn().mockReturnValue(of({
      id: 'recipient-1', saleId: 'sale-1', customerId: 'customer-1', status: 'Assigned',
      reason: 'El comprador regresó para solicitar su factura.', assignedAt: '2026-08-01T12:10:00Z',
      assignedBy: 'user-1', rowVersion: 0,
    })),
  };
  TestBed.configureTestingModule({
    providers: [CounterSalesStore, { provide: CounterSalesApiAdapter, useValue: api }],
  });
  return { store: TestBed.inject(CounterSalesStore), api };
}

const draftSaleFixture = {
  id: 'sale-1',
  folio: 'CS-1',
  saleDate: '2026-08-01T12:00:00Z',
  customerId: null,
  sourceWarehouseId: 'warehouse-1',
  status: 'Draft',
  paymentCondition: 'Cash',
  subtotal: 45.5,
  discountTotal: 0,
  taxTotal: 0,
  total: 45.5,
  paidAmount: 0,
  balance: 45.5,
  notes: null,
  items: [{ productId: product.id, quantity: 1, unitPrice: 45.5, discount: 0 }],
};

const saleRequest = {
  customerId: null,
  sourceWarehouseId: 'warehouse-1',
  paymentCondition: 0,
  taxTotal: 0,
  notes: null,
  items: [{ productId: product.id, quantity: 1, unitPrice: 45.5, discount: 0 }],
  payments: [],
};
