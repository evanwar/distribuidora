import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, concatMap, EMPTY, forkJoin, of, Subject, switchMap, tap, timer } from 'rxjs';
import { RealtimeService } from '../../../../core/realtime/realtime.service';
import { ProductSearchAdapter } from './product-search.adapter';
import { emptyProductSearch, ProductFacet, ProductSearch, SearchPage, SearchProduct } from '../models/product-search.models';

@Injectable()
export class ProductSearchStore {
  private readonly api = inject(ProductSearchAdapter);
  private readonly requests = new Subject<{ request: ProductSearch; delay: number; refresh: boolean }>();
  private readonly scans = new Subject<{ code: string; warehouseId: string }>();
  private readonly cache = new Map<string, { until: number; result: SearchPage<SearchProduct> }>();
  private readonly facetRequests = new Subject<{ kind: 'category' | 'brand'; text: string; page: number }>();
  readonly state = signal<ProductSearch>({ ...emptyProductSearch });
  readonly products = signal<readonly SearchProduct[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly recentIds = signal<string[]>([]);
  readonly recentQueries = signal<string[]>([]);
  readonly categories = signal<readonly ProductFacet[]>([]);
  readonly suggestedCategories = signal<readonly ProductFacet[]>([]);
  readonly suggestedBrands = signal<readonly ProductFacet[]>([]);
  readonly facetResults = signal<SearchPage<ProductFacet>>({ items: [], total: 0, page: 1 });
  readonly facetsLoading = signal(false);
  readonly facetError = signal('');
  readonly favoriteBusy = signal<string | null>(null);
  readonly resolvedScans = new Subject<{ product: SearchProduct; warehouseId: string }>();

  constructor() {
    this.requests.pipe(switchMap(({ request, delay, refresh }) => {
      this.loading.set(true);
      this.error.set('');
      this.suggestedCategories.set([]);
      this.suggestedBrands.set([]);
      const ids = request.collection === 'recent' ? this.recentIds() : undefined;
      const key = JSON.stringify([request, ids]);
      const cached = this.cache.get(key);
      return timer(delay).pipe(switchMap(() => {
        const page = request.collection === 'recent' && !ids?.length
          ? of({ items: [], total: 0, page: 1 } as SearchPage<SearchProduct>)
          : !refresh && cached && cached.until > Date.now() ? of(cached.result) : this.api.search(request, ids);
        return forkJoin({ page,
          categories: request.query ? this.api.facets('category', request.query).pipe(catchError(() => of(null))) : of(null),
          brands: request.query ? this.api.facets('brand', request.query).pipe(catchError(() => of(null))) : of(null) });
      }), tap(({ page, categories, brands }) => {
        this.products.set(page.items);
        this.total.set(page.total);
        this.suggestedCategories.set(categories?.items.slice(0, 2) ?? []);
        this.suggestedBrands.set(brands?.items.slice(0, 2) ?? []);
        this.loading.set(false);
        this.cache.delete(key);
        this.cache.set(key, { until: Date.now() + 30_000, result: page });
        if (this.cache.size > 20) this.cache.delete(this.cache.keys().next().value!);
      }), catchError(error => {
        this.error.set(errorMessage(error));
        this.products.set([]);
        this.total.set(0);
        this.loading.set(false);
        return EMPTY;
      }));
    }), takeUntilDestroyed()).subscribe();

    this.scans.pipe(concatMap(({ code, warehouseId }) => this.api.search({ ...emptyProductSearch, warehouseId, query: code }, undefined, true).pipe(
      tap(page => {
        if (warehouseId !== this.state().warehouseId) { this.notice.set('El almacén cambió. Vuelve a escanear el producto.'); return; }
        if (page.total === 1 && page.items[0]?.barcode === code)
          this.resolvedScans.next({ product: page.items[0], warehouseId });
        else this.notice.set(page.total > 1 ? 'El código corresponde a varios productos. Selecciona uno.' : 'No encontramos ese código de barras.');
      }), catchError(error => { this.notice.set(errorMessage(error)); return EMPTY; }),
    )), takeUntilDestroyed()).subscribe();

    this.facetRequests.pipe(switchMap(({ kind, text, page }) => {
      this.facetsLoading.set(true);
      this.facetError.set('');
      return timer(200).pipe(switchMap(() => this.api.facets(kind, text, page)), tap(result => {
        this.facetResults.set(result); this.facetsLoading.set(false);
      }), catchError(error => { this.facetError.set(errorMessage(error)); this.facetsLoading.set(false); return EMPTY; }));
    }), takeUntilDestroyed()).subscribe();

    this.api.facets('category').pipe(takeUntilDestroyed()).subscribe({
      next: page => this.categories.set(page.items.slice(0, 5)), error: () => this.categories.set([]),
    });
    const realtime = inject(RealtimeService);
    realtime.watch('inventory').pipe(takeUntilDestroyed()).subscribe(() => this.refresh());
    realtime.watch('catalogs').pipe(takeUntilDestroyed()).subscribe(() => this.refresh());
  }

  update(patch: Partial<ProductSearch>, delay = 0) {
    this.state.update(state => ({ ...state, ...patch, page: patch.page ?? 1 }));
    if (this.state().warehouseId) this.requests.next({ request: this.state(), delay, refresh: false });
  }
  refresh() {
    this.cache.clear();
    if (this.state().warehouseId) this.requests.next({ request: this.state(), delay: 0, refresh: true });
  }
  scan(code: string) {
    if (!code.trim() || !this.state().warehouseId) return;
    this.notice.set('');
    this.scans.next({ code: code.trim(), warehouseId: this.state().warehouseId });
  }
  added(product: SearchProduct) {
    this.recentIds.update(ids => [product.id, ...ids.filter(id => id !== product.id)].slice(0, 30));
    const query = this.state().query.trim();
    if (query) this.recentQueries.update(items => [query, ...items.filter(item => item !== query)].slice(0, 10));
    this.notice.set(`Agregado: ${product.name}`);
  }
  favorite(product: SearchProduct) {
    if (this.favoriteBusy()) return;
    this.favoriteBusy.set(product.id);
    this.api.favorite(product).subscribe({ next: () => { this.favoriteBusy.set(null); this.refresh(); },
      error: error => { this.favoriteBusy.set(null); this.notice.set(errorMessage(error)); } });
  }
  facets(kind: 'category' | 'brand', text = '', page = 1) { this.facetRequests.next({ kind, text, page }); }
}

function errorMessage(error: unknown): string {
  return typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
    ? error.message : 'No pudimos consultar los productos. Reintenta sin perder tu venta.';
}
