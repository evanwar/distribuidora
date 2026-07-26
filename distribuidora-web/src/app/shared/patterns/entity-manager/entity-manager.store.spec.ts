import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { EntityResourceDefinition } from './entity-manager.models';
import { EntityManagerStore } from './entity-manager.store';

describe('EntityManagerStore', () => {
  it('maps a paged backend response and preserves pagination metadata', () => {
    const api = {
      get: vi.fn().mockReturnValue(
        of({
          items: [{ id: 'product-1', sku: 'ARZ-001', name: 'Arroz premium' }],
          page: 2,
          pageSize: 25,
          total: 31,
        }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [EntityManagerStore, { provide: ApiClientService, useValue: api }],
    });
    const store = TestBed.inject(EntityManagerStore);
    const definition: EntityResourceDefinition = {
      module: 'F02',
      title: 'Productos',
      description: '',
      singular: 'producto',
      listEndpoint: '/api/v1/products',
      createEndpoint: '/api/v1/products',
      updateEndpoint: '/api/v1/products/{id}',
      paged: true,
      pageSize: 25,
      fields: [],
    };

    store.configure(definition);
    store.load(2, 25);

    expect(store.rows()).toEqual([{ id: 'product-1', sku: 'ARZ-001', name: 'Arroz premium' }]);
    expect(store.page()).toBe(2);
    expect(store.pageSize()).toBe(25);
    expect(store.total()).toBe(31);
    expect(api.get).toHaveBeenCalledWith('/api/v1/products', {
      query: { Page: 2, PageSize: 25 },
    });
  });

  it('keeps compatibility with non-paged catalog responses', () => {
    const api = { get: vi.fn().mockReturnValue(of([{ id: 'category-1', name: 'Abarrotes' }])) };
    TestBed.configureTestingModule({
      providers: [EntityManagerStore, { provide: ApiClientService, useValue: api }],
    });
    const store = TestBed.inject(EntityManagerStore);
    store.configure({
      module: 'F02',
      title: 'CategorÃ­as',
      description: '',
      singular: 'categorÃ­a',
      listEndpoint: '/api/v1/categories',
      createEndpoint: '/api/v1/categories',
      updateEndpoint: '/api/v1/categories/{id}',
      fields: [],
    });

    store.load();

    expect(store.rows()).toEqual([{ id: 'category-1', name: 'Abarrotes' }]);
    expect(store.total()).toBe(1);
  });
});
