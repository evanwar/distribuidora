import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { emptyProductSearch } from '../models/product-search.models';
import { ProductSearchAdapter } from './product-search.adapter';

describe('ProductSearchAdapter OpenAPI contract', () => {
  it('sends bounded search and warehouse filters and maps stock from the server', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const adapter = TestBed.inject(ProductSearchAdapter);
    const http = TestBed.inject(HttpTestingController);
    let total = 0;
    adapter.search({ ...emptyProductSearch, warehouseId: 'w1', query: 'coca 600', page: 2, inStockOnly: true }).subscribe(page => total = page.total);
    const request = http.expectOne(req => req.url === '/api/v1/pos-products');
    expect(request.request.params.get('PageSize')).toBe('30');
    expect(request.request.params.get('Page')).toBe('2');
    expect(request.request.params.get('WarehouseId')).toBe('w1');
    expect(request.request.params.get('Search')).toBe('coca 600');
    request.flush({ success: true, data: { items: [], total: 65, page: 2 } });
    expect(total).toBe(65); http.verify();
  });
});
