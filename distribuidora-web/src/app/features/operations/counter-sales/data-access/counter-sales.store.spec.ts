import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
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

  it('searches customers by phone after the input debounce', async () => {
    vi.useFakeTimers();
    const { store, api } = configureStoreWithApi();

    store.searchCustomers('55 1234 5678');
    await vi.advanceTimersByTimeAsync(250);

    expect(api.searchCustomers).toHaveBeenCalledWith('55 1234 5678');
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
  api: { loadWorkspace: ReturnType<typeof vi.fn>; searchCustomers: ReturnType<typeof vi.fn> };
} {
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
  };
  TestBed.configureTestingModule({
    providers: [CounterSalesStore, { provide: CounterSalesApiAdapter, useValue: api }],
  });
  return { store: TestBed.inject(CounterSalesStore), api };
}
