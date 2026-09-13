import { TestBed } from '@angular/core/testing';
import { NEVER, of, Subject, throwError } from 'rxjs';
import { RealtimeService } from '../../../../core/realtime/realtime.service';
import { ProductSearchAdapter } from './product-search.adapter';
import { ProductSearchStore } from './product-search.store';
import { SearchPage, SearchProduct } from '../models/product-search.models';

const product: SearchProduct = { id: 'p1', name: 'Coca-Cola 600 ml', sku: 'COC-600', barcode: '750123', price: 18,
  availableStock: 5, minimumStock: 2, categoryId: 'c1', categoryName: 'Bebidas', brandId: 'b1', brandName: 'Coca-Cola', favorite: false, soldQuantity: 3 };
const page = { items: [product], total: 1, page: 1 };

describe('ProductSearchStore', () => {
  let store: ProductSearchStore;
  let api: { search: ReturnType<typeof vi.fn>; facets: ReturnType<typeof vi.fn>; favorite: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    vi.useFakeTimers();
    api = { search: vi.fn().mockReturnValue(of(page)), facets: vi.fn().mockReturnValue(of({ items: [], total: 0, page: 1 })), favorite: vi.fn().mockReturnValue(of({ success: true })) };
    TestBed.configureTestingModule({ providers: [ProductSearchStore, { provide: ProductSearchAdapter, useValue: api },
      { provide: RealtimeService, useValue: { watch: () => NEVER } }] });
    store = TestBed.inject(ProductSearchStore);
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.useRealTimers(); });
  it('debounces text and immediately cancels obsolete searches', async () => {
    const old = new Subject<SearchPage<SearchProduct>>();
    api.search.mockReturnValueOnce(old);
    store.update({ warehouseId: 'w1', query: 'co' }, 200);
    await vi.advanceTimersByTimeAsync(200);
    expect(old.observed).toBe(true);
    store.update({ query: 'coca' }, 200);
    expect(old.observed).toBe(false);
    old.next({ items: [], page: 1, total: 0 });
    await vi.advanceTimersByTimeAsync(200);
    expect(store.products()).toEqual([product]);
    expect(store.loading()).toBe(false);
  });
  it('serializes repeated exact barcode scans without deduplicating intentional units', () => {
    store.state.update(state => ({ ...state, warehouseId: 'w1' }));
    const resolved = vi.fn(); store.resolvedScans.subscribe(resolved);
    store.scan('750123'); store.scan('750123');
    expect(resolved).toHaveBeenCalledTimes(2);
    expect(api.search.mock.calls.every(call => call[2] === true)).toBe(true);
  });
  it('recovers after a failed search and never treats errors as success', async () => {
    api.search.mockReturnValueOnce(throwError(() => new Error('Sin conexión')));
    store.update({ warehouseId: 'w1' }); await vi.advanceTimersByTimeAsync(0);
    expect(store.error()).toBe('Sin conexión');
    store.refresh(); await vi.advanceTimersByTimeAsync(0);
    expect(store.error()).toBe(''); expect(store.total()).toBe(1);
  });
  it('does not query an empty recent selection and keeps warehouse cache isolated', async () => {
    store.update({ warehouseId: 'w1', collection: 'recent' }); await vi.advanceTimersByTimeAsync(0);
    expect(api.search).not.toHaveBeenCalled();
    store.update({ collection: 'all' }); await vi.advanceTimersByTimeAsync(0);
    store.update({ warehouseId: 'w2' }); await vi.advanceTimersByTimeAsync(0);
    expect(api.search).toHaveBeenCalledTimes(2);
  });
});
