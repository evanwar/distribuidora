import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, output, signal, TemplateRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiIconButtonComponent } from '../../../../shared/ui/button/ui-icon-button.component';
import { UiFeedbackComponent } from '../../../../shared/ui/feedback/ui-feedback.component';
import { ProductSearchStore } from '../data-access/product-search.store';
import { ProductCollection, ProductFacet, SearchProduct } from '../models/product-search.models';
import { SaleLine } from '../models/counter-sale.models';
import { ProductResultsComponent } from '../ui/product-search/product-results.component';
import { LanguageService } from '../../../../core/i18n/language.service';

@Component({
  selector: 'app-product-picker',
  providers: [ProductSearchStore],
  imports: [ReactiveFormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule,
    MatChipsModule, MatCheckboxModule, MatButtonToggleModule, MatDialogModule, MatProgressBarModule,
    UiButtonComponent, UiIconButtonComponent, UiFeedbackComponent, ProductResultsComponent],
  templateUrl: './product-picker.component.html',
  styleUrl: './product-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'shortcut($event)' },
})
export class ProductPickerComponent {
  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) private autocomplete?: MatAutocompleteTrigger;
  @ViewChild('facetDialog') private facetDialog?: TemplateRef<unknown>;
  private readonly dialog = inject(MatDialog);
  private readonly language = inject(LanguageService);
  protected readonly store = inject(ProductSearchStore);
  readonly warehouseId = input.required<string>();
  readonly lines = input<readonly SaleLine[]>([]);
  readonly add = output<SearchProduct>();
  readonly decrease = output<SearchProduct>();
  readonly results = output<{ products: readonly SearchProduct[]; warehouseId: string }>();
  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly view = signal<'list' | 'grid'>('list');
  protected readonly showFilters = signal(false);
  protected readonly facetKind = signal<'category' | 'brand'>('category');
  protected readonly facetSearch = new FormControl('', { nonNullable: true });
  protected readonly filters = new FormGroup({
    minimumPrice: new FormControl<number | null>(null), maximumPrice: new FormControl<number | null>(null),
    inStockOnly: new FormControl(false, { nonNullable: true }), lowStockOnly: new FormControl(false, { nonNullable: true }),
  });
  protected readonly filterError = signal('');
  protected readonly quantities = computed(() => Object.fromEntries(this.lines().map(line => [line.productId, line.quantity])));
  protected readonly collections: { id: ProductCollection; label: string }[] = [
    { id: 'all', label: 'Todos' }, { id: 'favorites', label: '★ Favoritos' },
    { id: 'best', label: 'Más vendidos' }, { id: 'recent', label: 'Recientes' },
  ];
  protected readonly heading = computed(() => this.store.state().query
    ? `Resultados para “${this.store.state().query}”`
    : this.store.state().collection === 'all' ? 'Productos frecuentes y catálogo'
    : this.collections.find(x => x.id === this.store.state().collection)?.label ?? 'Productos');
  protected readonly chips = computed(() => {
    const state = this.store.state();
    return [state.category ? { key: 'category', label: state.category.name } : null,
      state.brand ? { key: 'brand', label: state.brand.name } : null,
      state.inStockOnly ? { key: 'inStockOnly', label: 'Con existencia' } : null,
      state.lowStockOnly ? { key: 'lowStockOnly', label: 'Inventario bajo' } : null,
      state.minimumPrice !== undefined || state.maximumPrice !== undefined
        ? { key: 'price', label: `$${state.minimumPrice ?? 0} – ${state.maximumPrice === undefined ? 'sin máximo' : '$' + state.maximumPrice}` } : null,
    ].filter((item): item is { key: string; label: string } => item !== null);
  });

  constructor() {
    effect(() => { const warehouseId = this.warehouseId(); if (warehouseId !== this.store.state().warehouseId) this.store.update({ warehouseId }); });
    effect(() => { if (!this.store.loading() && !this.store.error()) this.results.emit({ products: this.store.products(), warehouseId: this.store.state().warehouseId }); });
    this.search.valueChanges.pipe(takeUntilDestroyed()).subscribe(query => this.store.update({ query }, 200));
    this.facetSearch.valueChanges.pipe(takeUntilDestroyed()).subscribe(text => this.store.facets(this.facetKind(), text));
    this.store.resolvedScans.pipe(takeUntilDestroyed()).subscribe(({ product }) => this.addProduct(product));
  }
  protected focusSearch() { this.searchInput?.nativeElement.focus({ preventScroll: true }); this.searchInput?.nativeElement.select(); }
  protected shortcut(event: KeyboardEvent) {
    if (event.key === 'F2' && this.dialog.openDialogs.length === 0) { event.preventDefault(); this.focusSearch(); }
  }
  protected searchKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.autocomplete?.panelOpen) this.autocomplete.closePanel(); else this.search.setValue('');
    }
    if (event.key !== 'Enter' || event.isComposing || event.repeat) return;
    if (this.autocomplete?.panelOpen && this.autocomplete.activeOption) return;
    event.preventDefault(); event.stopPropagation();
    const query = this.search.value.trim();
    if (/^\d+$/.test(query) || !this.store.products().length || this.store.products().some(p => p.barcode === query)) {
      this.store.scan(query); this.searchInput?.nativeElement.select();
    } else if (!this.store.loading()) {
      const first = this.store.products()[0]; if (first) this.addProduct(first);
    }
  }
  protected selectSuggestion(event: MatAutocompleteSelectedEvent) {
    const value = event.option.value as { kind: string; product?: SearchProduct; facet?: ProductFacet; query?: string };
    const query = this.store.state().query;
    this.search.setValue(query, { emitEvent: false });
    if (value.kind === 'product' && value.product && !this.store.loading()) this.addProduct(value.product);
    else if (value.kind === 'category' && value.facet) this.store.update({ category: value.facet });
    else if (value.kind === 'brand' && value.facet) this.store.update({ brand: value.facet });
    else if (value.query) this.search.setValue(value.query);
  }
  protected addProduct(product: SearchProduct) {
    if ((this.quantities()[product.id] ?? 0) + 1 > product.availableStock) {
      this.store.notice.set(`No hay más unidades disponibles de ${product.name}.`); return;
    }
    this.add.emit(product); this.store.added(product); this.focusSearch(); this.autocomplete?.closePanel();
  }
  protected applyFilters() {
    const value = this.filters.getRawValue();
    if ([value.minimumPrice, value.maximumPrice].some(x => x !== null && (!Number.isFinite(x) || x < 0)) ||
      (value.minimumPrice !== null && value.maximumPrice !== null && value.minimumPrice > value.maximumPrice)) {
      this.filterError.set('Revisa el rango de precios. El mínimo no puede superar al máximo.'); return;
    }
    this.filterError.set(''); this.showFilters.set(false);
    this.store.update({ ...value, minimumPrice: value.minimumPrice ?? undefined, maximumPrice: value.maximumPrice ?? undefined });
  }
  protected clearFilters() {
    this.filters.reset(); this.filterError.set('');
    this.store.update({ category: null, brand: null, minimumPrice: undefined, maximumPrice: undefined,
      inStockOnly: false, lowStockOnly: false, collection: 'all' });
  }
  protected removeChip(key: string) {
    if (key === 'price') { this.filters.patchValue({ minimumPrice: null, maximumPrice: null }); this.store.update({ minimumPrice: undefined, maximumPrice: undefined }); }
    else if (key === 'category' || key === 'brand') this.store.update({ [key]: null });
    else if (key === 'inStockOnly' || key === 'lowStockOnly') { this.filters.patchValue({ [key]: false }); this.store.update({ [key]: false }); }
  }
  protected openFacets(kind: 'category' | 'brand') {
    this.facetKind.set(kind); this.facetSearch.setValue('', { emitEvent: false }); this.store.facets(kind);
    if (this.facetDialog) this.dialog.open(this.facetDialog, { width: '440px', maxWidth: 'calc(100vw - 24px)', autoFocus: 'first-tabbable' });
  }
  protected chooseFacet(facet: ProductFacet) { this.store.update({ [this.facetKind()]: facet }); this.dialog.closeAll(); }
  protected facetPage(offset: number) { this.store.facets(this.facetKind(), this.facetSearch.value, this.store.facetResults().page + offset); }
  protected text(value: string): string { return this.language.text(value); }
}
