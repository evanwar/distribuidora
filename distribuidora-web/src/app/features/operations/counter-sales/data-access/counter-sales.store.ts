import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  finalize,
  Observable,
  Subject,
  switchMap,
} from 'rxjs';
import { ApiError } from '../../../../core/error-handling/api-error.model';
import { CounterSalesApiAdapter } from './counter-sales-api.adapter';
import {
  CounterSale,
  CreateCounterSale,
  PosCustomer,
  PosPaymentMethod,
  PosProduct,
  PosStockBalance,
  PosWarehouse,
  SaleLine,
} from '../models/counter-sale.models';

@Injectable()
export class CounterSalesStore {
  private readonly api = inject(CounterSalesApiAdapter);
  private readonly customersState = signal<readonly PosCustomer[]>([]);
  private readonly customerSearchRequests = new Subject<string>();
  private readonly customersLoadingState = signal(false);
  private readonly productsState = signal<readonly PosProduct[]>([]);
  private readonly warehousesState = signal<readonly PosWarehouse[]>([]);
  private readonly balancesState = signal<readonly PosStockBalance[]>([]);
  private readonly activeWarehouseIdState = signal('');
  private readonly paymentMethodsState = signal<readonly PosPaymentMethod[]>([]);
  private readonly salesState = signal<readonly CounterSale[]>([]);
  private readonly linesState = signal<readonly SaleLine[]>([]);
  private readonly queryState = signal('');
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<ApiError | null>(null);
  private readonly noticeState = signal<string | null>(null);
  private readonly stockNoticeState = signal<string | null>(null);
  private editingSaleIdState = signal<string | null>(null);

  readonly customers = this.customersState.asReadonly();
  readonly customersLoading = this.customersLoadingState.asReadonly();
  readonly products = computed(() => {
    const query = this.queryState().trim().toLocaleLowerCase('es-MX');
    if (!query) return this.productsState().slice(0, 12);
    return this.productsState()
      .filter((product) =>
        [product.name, product.sku, product.barcode].some((value) =>
          value.toLocaleLowerCase('es-MX').includes(query),
        ),
      )
      .slice(0, 24);
  });
  readonly warehouses = this.warehousesState.asReadonly();
  readonly paymentMethods = this.paymentMethodsState.asReadonly();
  readonly sales = this.salesState.asReadonly();
  readonly lines = this.linesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly notice = this.noticeState.asReadonly();
  readonly stockNotice = this.stockNoticeState.asReadonly();
  readonly editingSaleId = this.editingSaleIdState.asReadonly();
  readonly subtotal = computed(() =>
    this.linesState().reduce((total, line) => total + line.quantity * line.unitPrice, 0),
  );
  readonly discount = computed(() =>
    this.linesState().reduce((total, line) => total + line.discount, 0),
  );

  constructor() {
    this.customerSearchRequests
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((query) => {
          this.customersLoadingState.set(true);
          return this.api
            .searchCustomers(query)
            .pipe(
              catchError((error: ApiError) => {
                this.errorState.set(error);
                return EMPTY;
              }),
              finalize(() => this.customersLoadingState.set(false)),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (customers) => this.customersState.set(customers),
      });
  }

  load(): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.api
      .loadWorkspace()
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (data) => {
          this.customersState.set(data.customers);
          this.productsState.set(data.products);
          this.warehousesState.set(data.warehouses);
          this.balancesState.set(data.balances);
          this.paymentMethodsState.set(data.paymentMethods);
          this.salesState.set(data.sales);
          this.reconcileLinesWithStock();
        },
        error: (error: ApiError) => this.errorState.set(error),
      });
  }

  search(query: string): void {
    this.queryState.set(query);
  }

  searchCustomers(query: string): void {
    this.customerSearchRequests.next(query);
  }

  selectWarehouse(warehouseId: string): void {
    if (warehouseId === this.activeWarehouseIdState()) return;
    this.activeWarehouseIdState.set(warehouseId);
    this.reconcileLinesWithStock();
  }

  availableStock(productId: string): number {
    const balance = this.balancesState().find(
      (item) => item.warehouseId === this.activeWarehouseIdState() && item.productId === productId,
    );
    return Math.max(0, (balance?.quantity ?? 0) - (balance?.reservedQuantity ?? 0));
  }

  canAdd(productId: string): boolean {
    const current = this.linesState().find((line) => line.productId === productId)?.quantity ?? 0;
    return current < this.availableStock(productId);
  }

  hasValidStock(): boolean {
    return this.linesState().every(
      (line) => line.quantity > 0 && line.quantity <= this.availableStock(line.productId),
    );
  }

  add(product: PosProduct): void {
    if (!this.canAdd(product.id)) {
      this.stockNoticeState.set(
        this.availableStock(product.id) <= 0
          ? `${product.name} no tiene existencia disponible en el almacén seleccionado.`
          : `Sólo hay ${this.availableStock(product.id)} unidades disponibles de ${product.name}.`,
      );
      return;
    }
    this.stockNoticeState.set(null);
    const existing = this.linesState().find((line) => line.productId === product.id);
    if (existing) {
      this.changeQuantity(product.id, existing.quantity + 1);
      return;
    }
    this.linesState.update((lines) => [
      ...lines,
      {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
      },
    ]);
  }

  changeQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.remove(productId);
      return;
    }
    const maximum = this.availableStock(productId);
    const accepted = Math.min(quantity, maximum);
    if (quantity > maximum) {
      const product = this.productsState().find((item) => item.id === productId);
      this.stockNoticeState.set(
        `Sólo hay ${maximum} unidades disponibles${product ? ` de ${product.name}` : ''}.`,
      );
    } else {
      this.stockNoticeState.set(null);
    }
    if (accepted <= 0) {
      this.remove(productId);
      return;
    }
    this.linesState.update((lines) =>
      lines.map((line) => (line.productId === productId ? { ...line, quantity: accepted } : line)),
    );
  }

  remove(productId: string): void {
    this.linesState.update((lines) => lines.filter((line) => line.productId !== productId));
  }

  resume(sale: CounterSale): void {
    if (sale.status.toLocaleLowerCase('en') !== 'draft') return;
    this.linesState.set(
      sale.items.map((line) => {
        const product = this.productsState().find((item) => item.id === line.productId);
        return {
          ...line,
          sku: product?.sku ?? '',
          name: product?.name ?? 'Producto',
        };
      }),
    );
    this.editingSaleIdState.set(sale.id);
    this.noticeState.set(`Editando el borrador ${sale.folio}.`);
  }

  clear(): void {
    this.linesState.set([]);
    this.editingSaleIdState.set(null);
    this.noticeState.set(null);
    this.stockNoticeState.set(null);
    this.errorState.set(null);
  }

  save(request: CreateCounterSale, confirm: boolean, completed: (sale: CounterSale) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);
    const currentId = this.editingSaleIdState();
    const saveRequest = currentId ? this.api.update(currentId, request) : this.api.create(request);
    saveRequest
      .pipe(
        switchMap((sale) => (confirm ? this.api.confirm(sale.id) : [sale])),
        finalize(() => this.savingState.set(false)),
      )
      .subscribe({
        next: (sale) => {
          this.noticeState.set(
            confirm
              ? `Venta ${sale.folio} cobrada y confirmada.`
              : `Borrador ${sale.folio} guardado.`,
          );
          this.linesState.set([]);
          this.editingSaleIdState.set(null);
          completed(sale);
          this.load();
        },
        error: (error: ApiError) => this.errorState.set(error),
      });
  }

  confirmSale(sale: CounterSale): void {
    this.runAction(this.api.confirm(sale.id), `La venta ${sale.folio} quedó confirmada.`);
  }

  cancelSale(sale: CounterSale, reason: string): void {
    this.runAction(this.api.cancel(sale.id, reason), `La venta ${sale.folio} quedó cancelada.`);
  }

  addPayment(
    sale: CounterSale,
    request: { method: string; amount: number; reference: string | null },
  ): void {
    this.runAction(this.api.addPayment(sale.id, request), `El pago se registró en ${sale.folio}.`);
  }

  print(sale: CounterSale, completed: (printable: CounterSale) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);
    this.api
      .getPrintable(sale.id)
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: completed,
        error: (error: ApiError) => this.errorState.set(error),
      });
  }

  private runAction(request: Observable<unknown>, notice: string): void {
    this.savingState.set(true);
    this.errorState.set(null);
    request.pipe(finalize(() => this.savingState.set(false))).subscribe({
      next: () => {
        this.noticeState.set(notice);
        this.load();
      },
      error: (error: ApiError) => this.errorState.set(error),
    });
  }

  private reconcileLinesWithStock(): void {
    let adjusted = false;
    this.linesState.update((lines) =>
      lines.flatMap((line) => {
        const available = this.availableStock(line.productId);
        if (available <= 0) {
          adjusted = true;
          return [];
        }
        if (line.quantity > available) {
          adjusted = true;
          return [{ ...line, quantity: available }];
        }
        return [line];
      }),
    );
    if (adjusted) {
      this.stockNoticeState.set(
        'Se ajustó el carrito a la existencia disponible del almacén seleccionado.',
      );
    }
  }
}
