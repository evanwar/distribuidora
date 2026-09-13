import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  finalize,
  filter,
  last,
  Observable,
  Subject,
  switchMap,
  tap,
  takeUntil,
  takeWhile,
} from 'rxjs';
import { ApiError } from '../../../../core/error-handling/api-error.model';
import { OperationContextService } from '../../../../core/observability/operation-context.service';
import { RealtimeService } from '../../../../core/realtime/realtime.service';
import { SearchProduct } from '../models/product-search.models';
import { CounterSalesApiAdapter } from './counter-sales-api.adapter';
import {
  CounterSale,
  CreateCounterSale,
  PosCustomer,
  PosPaymentMethod,
  PosPaymentTerminal,
  PointCardPayment,
  ElectronicInvoice,
  IssueElectronicInvoice,
  SaleBillingEligibility,
  PosProduct,
  PosStockBalance,
  PosWarehouse,
  SaleLine,
} from '../models/counter-sale.models';

@Injectable()
export class CounterSalesStore {
  private readonly api = inject(CounterSalesApiAdapter);
  private readonly operations = inject(OperationContextService);
  private readonly realtime = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly operation = this.operations.restoreOrStart('POS', 'counter-sales');
  private readonly customersState = signal<readonly PosCustomer[]>([]);
  private readonly customerSearchRequests = new Subject<string>();
  private readonly cardPaymentStopRequests = new Subject<void>();
  private readonly customersLoadingState = signal(false);
  private readonly productsState = signal<readonly PosProduct[]>([]);
  private readonly warehousesState = signal<readonly PosWarehouse[]>([]);
  private readonly balancesState = signal<readonly PosStockBalance[]>([]);
  private readonly cartStockRequests = new Subject<string>();
  private readonly cartStockLoading = signal(false);
  private readonly activeWarehouseIdState = signal('');
  private readonly paymentMethodsState = signal<readonly PosPaymentMethod[]>([]);
  private readonly paymentTerminalsState = signal<readonly PosPaymentTerminal[]>([]);
  private readonly salesState = signal<readonly CounterSale[]>([]);
  private readonly linesState = signal<readonly SaleLine[]>([]);
  private readonly queryState = signal('');
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly terminalCancellingState = signal(false);
  private readonly errorState = signal<ApiError | null>(null);
  private readonly noticeState = signal<string | null>(null);
  private readonly stockNoticeState = signal<string | null>(null);
  private readonly cardPaymentState = signal<PointCardPayment | null>(null);
  private readonly electronicInvoiceState = signal<ElectronicInvoice | null>(null);
  private readonly billingEligibilityState = signal<SaleBillingEligibility | null>(null);
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
  readonly paymentTerminals = this.paymentTerminalsState.asReadonly();
  readonly sales = this.salesState.asReadonly();
  readonly lines = this.linesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly terminalCancelling = this.terminalCancellingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly notice = this.noticeState.asReadonly();
  readonly stockNotice = this.stockNoticeState.asReadonly();
  readonly cardPayment = this.cardPaymentState.asReadonly();
  readonly electronicInvoice = this.electronicInvoiceState.asReadonly();
  readonly billingEligibility = this.billingEligibilityState.asReadonly();
  readonly editingSaleId = this.editingSaleIdState.asReadonly();
  readonly subtotal = computed(() =>
    this.linesState().reduce((total, line) => total + line.quantity * line.unitPrice, 0),
  );
  readonly discount = computed(() =>
    this.linesState().reduce((total, line) => total + line.discount, 0),
  );

  resetElectronicInvoice(): void {
    this.electronicInvoiceState.set(null);
    this.billingEligibilityState.set(null);
  }

  constructor() {
    this.cartStockRequests.pipe(switchMap(warehouseId => {
      this.cartStockLoading.set(true);
      const ids = this.linesState().map(line => line.productId);
      return this.api.loadCartProducts(warehouseId, ids).pipe(tap(products => {
        if (warehouseId !== this.activeWarehouseIdState()) return;
        this.balancesState.update(current => current.filter(balance => balance.warehouseId !== warehouseId || !ids.includes(balance.productId)));
        this.acceptSearchProducts(products, warehouseId);
        this.cartStockLoading.set(false);
        this.linesState.update(lines => lines.map(line => {
          const product = products.find(item => item.id === line.productId);
          return product ? { ...line, name: product.name, sku: product.sku } : line;
        }));
        if (!this.hasValidStock()) this.stockNoticeState.set('La existencia cambió. Revisa las cantidades antes de cobrar. Tu venta se conservó.');
      }), catchError((error: ApiError) => {
        this.errorState.set(error);
        this.stockNoticeState.set(error.message || 'No pudimos verificar la existencia. Reintenta antes de cobrar.');
        return EMPTY;
      }));
    }), takeUntilDestroyed()).subscribe();
    this.customerSearchRequests
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((query) => {
          this.customersLoadingState.set(true);
          return this.api.searchCustomers(query, this.requestContext()).pipe(
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
      .loadWorkspace(this.requestContext())
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (data) => {
          this.customersState.set(data.customers);
          this.productsState.set(data.products);
          this.warehousesState.set(data.warehouses);
          this.balancesState.set(data.balances);
          this.paymentMethodsState.set(data.paymentMethods);
          this.paymentTerminalsState.set(data.paymentTerminals);
          this.salesState.set(data.sales);
          if (this.linesState().length && this.activeWarehouseIdState()) this.cartStockRequests.next(this.activeWarehouseIdState());
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
    if (this.linesState().length) this.cartStockRequests.next(warehouseId);
  }

  availableStock(productId: string): number {
    const balance = this.balancesState().find(
      (item) => item.warehouseId === this.activeWarehouseIdState() && item.productId === productId,
    );
    return Math.max(0, (balance?.quantity ?? 0) - (balance?.reservedQuantity ?? 0));
  }

  acceptSearchProducts(products: readonly SearchProduct[], warehouseId: string): void {
    if (warehouseId !== this.activeWarehouseIdState()) return;
    const ids = new Set(products.map(product => product.id));
    const cartIds = new Set(this.linesState().map(line => line.productId));
    this.productsState.update(current => [...current.filter(product => cartIds.has(product.id) && !ids.has(product.id)), ...products]);
    this.balancesState.update(current => [
      ...current.filter(balance => balance.warehouseId === warehouseId && cartIds.has(balance.productId) && !ids.has(balance.productId)),
      ...products.map(product => ({ warehouseId, productId: product.id, quantity: product.availableStock, reservedQuantity: 0 })),
    ]);
  }

  addSearchProduct(product: SearchProduct): void {
    this.acceptSearchProducts([product], this.activeWarehouseIdState());
    this.add(product);
  }

  decreaseProduct(productId: string): void {
    const line = this.linesState().find(item => item.productId === productId);
    if (line) this.changeQuantity(productId, line.quantity - 1);
  }

  canAdd(productId: string): boolean {
    const current = this.linesState().find((line) => line.productId === productId)?.quantity ?? 0;
    return current + 1 <= this.availableStock(productId);
  }

  hasValidStock(): boolean {
    return !this.cartStockLoading() && this.linesState().every(
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

  addAll(product: PosProduct): void {
    const maximum = this.availableStock(product.id);
    if (maximum <= 0) {
      this.stockNoticeState.set(
        `${product.name} no tiene existencia disponible en el almacén seleccionado.`,
      );
      return;
    }

    this.stockNoticeState.set(null);
    const existing = this.linesState().some((line) => line.productId === product.id);
    if (existing) {
      this.changeQuantity(product.id, maximum);
      return;
    }

    this.linesState.update((lines) => [
      ...lines,
      {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity: maximum,
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
    if (this.activeWarehouseIdState()) this.cartStockRequests.next(this.activeWarehouseIdState());
    this.noticeState.set(`Editando el borrador ${sale.folio}.`);
  }

  clear(): void {
    this.linesState.set([]);
    this.editingSaleIdState.set(null);
    this.noticeState.set(null);
    this.stockNoticeState.set(null);
    this.errorState.set(null);
    this.cardPaymentState.set(null);
  }

  saveCard(
    request: CreateCounterSale,
    paymentTerminalId: string,
    completed: (sale: CounterSale) => void,
  ): void {
    this.savingState.set(true);
    this.errorState.set(null);
    this.cardPaymentState.set(null);
    const currentId = this.editingSaleIdState();
    const saveRequest = currentId
      ? this.api.update(currentId, request, this.requestContext())
      : this.api.create(request, this.requestContext());
    saveRequest
      .pipe(
        switchMap((sale) =>
          this.api.startCardPayment(
            sale.id,
            sale.balance,
            paymentTerminalId,
            this.requestContext(),
          ).pipe(
            tap((payment) => {
              this.cardPaymentState.set(payment);
              this.noticeState.set('Cobro enviado a la terminal. Esperando la tarjeta del cliente.');
            }),
            switchMap((startedPayment) =>
              this.realtime.watch('sales').pipe(
                filter(
                  (change) =>
                    change === null ||
                    (change.entityName === 'CounterSale' && change.entityId === sale.id) ||
                    (change.entityName === 'PointPayment' && change.entityId === startedPayment.id),
                ),
                switchMap(() => this.api.getCardPayment(sale.id, this.requestContext())),
                tap((payment) => this.cardPaymentState.set(payment)),
                takeWhile((payment) => !isTerminalPointStatus(payment.status), true),
                last(),
                takeUntil(this.cardPaymentStopRequests),
                switchMap((payment) => {
                  this.cardPaymentState.set(payment);
                  return payment.status.toLocaleLowerCase('en') === 'approved'
                    ? this.api.getById(sale.id, this.requestContext())
                    : [null];
                }),
              ),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.savingState.set(false)),
      )
      .subscribe({
        next: (sale) => {
          if (sale && sale.status.toLocaleLowerCase('en') === 'confirmed' && sale.balance === 0) {
            this.noticeState.set(`Pago aprobado y venta ${sale.folio} confirmada.`);
            this.linesState.set([]);
            this.editingSaleIdState.set(null);
            completed(sale);
            this.load();
            return;
          }
          if (sale) {
            this.noticeState.set(
              'El pago fue acreditado, pero la venta todavía no refleja la confirmación. No vuelvas a cobrar y solicita conciliación.',
            );
            return;
          }
          this.noticeState.set(pointStatusMessage(this.cardPaymentState()));
        },
        error: (error: ApiError) => this.errorState.set(error),
      });
  }

  cancelCardPayment(completed?: () => void): void {
    const payment = this.cardPaymentState();
    if (!payment || this.terminalCancellingState()) return;

    this.cardPaymentStopRequests.next();
    this.terminalCancellingState.set(true);
    this.errorState.set(null);
    this.api
      .cancelCardPayment(payment.saleId, this.requestContext())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.terminalCancellingState.set(false)),
      )
      .subscribe({
        next: (cancelledPayment) => {
          this.cardPaymentState.set(cancelledPayment);
          this.noticeState.set(cancelledPayment.status.toLocaleLowerCase('en') === 'cancelled'
            ? 'Cobro cancelado. La terminal está disponible y el carrito permanece abierto.'
            : 'Cancelación enviada. Esperando que Mercado Pago confirme que la terminal quedó disponible.');
          completed?.();
        },
        error: (error: ApiError) => this.errorState.set(error),
      });
  }

  save(request: CreateCounterSale, confirm: boolean, completed: (sale: CounterSale) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);
    const currentId = this.editingSaleIdState();
    const saveRequest = currentId
      ? this.api.update(currentId, request, this.requestContext())
      : this.api.create(request, this.requestContext());
    saveRequest
      .pipe(
        switchMap((sale) => (confirm ? this.api.confirm(sale.id, this.requestContext()) : [sale])),
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
    this.runAction(
      this.api.confirm(sale.id, this.requestContext()),
      `La venta ${sale.folio} quedó confirmada.`,
    );
  }

  cancelSale(sale: CounterSale, reason: string): void {
    this.runAction(
      this.api.cancel(sale.id, reason, this.requestContext()),
      `La venta ${sale.folio} quedó cancelada.`,
    );
  }

  addPayment(
    sale: CounterSale,
    request: { method: string; amount: number; reference: string | null },
  ): void {
    this.runAction(
      this.api.addPayment(sale.id, request, this.requestContext()),
      `El pago se registró en ${sale.folio}.`,
    );
  }

  print(sale: CounterSale, completed: (printable: CounterSale) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);
    this.api
      .getPrintable(sale.id, this.requestContext())
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: completed,
        error: (error: ApiError) => this.errorState.set(error),
      });
  }

  loadElectronicInvoice(sale: CounterSale, completed: (invoice: ElectronicInvoice | null) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);
    this.api.getElectronicInvoice(sale.id, this.requestContext()).pipe(
      finalize(() => this.savingState.set(false)),
    ).subscribe({
      next: (invoice) => { this.electronicInvoiceState.set(invoice); completed(invoice); },
      error: (error: ApiError) => {
        if (error.status === 404) { this.electronicInvoiceState.set(null); completed(null); return; }
        this.errorState.set(error);
      },
    });
  }

  loadBillingEligibility(sale: CounterSale, completed: (eligibility: SaleBillingEligibility) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);
    this.api.getBillingEligibility(sale.id, this.requestContext()).pipe(
      finalize(() => this.savingState.set(false)),
    ).subscribe({
      next: (eligibility) => { this.billingEligibilityState.set(eligibility); completed(eligibility); },
      error: (error: ApiError) => this.errorState.set(error),
    });
  }

  assignBillingRecipient(
    sale: CounterSale,
    customerId: string,
    reason: string,
    completed: (eligibility: SaleBillingEligibility) => void,
  ): void {
    const eligibility = this.billingEligibilityState();
    if (!eligibility) return;
    this.savingState.set(true);
    this.errorState.set(null);
    this.api.assignBillingRecipient(sale.id, {
      customerId, reason, rowVersion: eligibility.rowVersion,
    }, this.requestContext()).pipe(
      switchMap(() => this.api.getBillingEligibility(sale.id, this.requestContext())),
      finalize(() => this.savingState.set(false)),
    ).subscribe({
      next: (updated) => {
        this.billingEligibilityState.set(updated);
        this.noticeState.set(`Receptor fiscal asociado a ${sale.folio}.`);
        completed(updated);
      },
      error: (error: ApiError) => this.errorState.set(error),
    });
  }

  reconcileFiscalCoverage(
    sale: CounterSale,
    request: { coverageStatus: string; reason: string; globalInvoiceFiscalUuid: string | null },
    completed: (eligibility: SaleBillingEligibility) => void,
  ): void {
    const eligibility = this.billingEligibilityState();
    if (!eligibility) return;
    this.savingState.set(true);
    this.errorState.set(null);
    this.api.reconcileFiscalCoverage(sale.id, {
      ...request, rowVersion: eligibility.rowVersion,
    }, this.requestContext()).pipe(
      switchMap(() => this.api.getBillingEligibility(sale.id, this.requestContext())),
      finalize(() => this.savingState.set(false)),
    ).subscribe({
      next: (updated) => {
        this.billingEligibilityState.set(updated);
        this.noticeState.set(`Cobertura fiscal de ${sale.folio} conciliada.`);
        completed(updated);
      },
      error: (error: ApiError) => this.errorState.set(error),
    });
  }

  issueElectronicInvoice(sale: CounterSale, request: IssueElectronicInvoice, completed: (invoice: ElectronicInvoice) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);
    this.api.issueElectronicInvoice(sale.id, request, this.requestContext()).pipe(
      finalize(() => this.savingState.set(false)),
    ).subscribe({
      next: (invoice) => {
        this.electronicInvoiceState.set(invoice);
        this.noticeState.set(`Factura ${invoice.fiscalUuid ?? sale.folio} emitida correctamente.`);
        completed(invoice);
      },
      error: (error: ApiError) => this.errorState.set(error),
    });
  }

  cancelElectronicInvoice(sale: CounterSale, reasonCode: string, replacementUuid: string | null, completed: (invoice: ElectronicInvoice) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);
    this.api.cancelElectronicInvoice(sale.id, reasonCode, replacementUuid, this.requestContext()).pipe(
      finalize(() => this.savingState.set(false)),
    ).subscribe({
      next: (invoice) => {
        this.electronicInvoiceState.set(invoice);
        this.noticeState.set(`La cancelación fiscal de ${sale.folio} fue solicitada correctamente.`);
        completed(invoice);
      },
      error: (error: ApiError) => this.errorState.set(error),
    });
  }

  downloadElectronicInvoice(sale: CounterSale, format: 'xml' | 'pdf', completed: (blob: Blob) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);
    this.api.downloadElectronicInvoice(sale.id, format, this.requestContext()).pipe(
      finalize(() => this.savingState.set(false)),
    ).subscribe({ next: completed, error: (error: ApiError) => this.errorState.set(error) });
  }

  private requestContext() {
    return this.operations.toHttpContext(this.operation);
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

}

function isTerminalPointStatus(status: string): boolean {
  return ['approved', 'failed', 'cancelled', 'expired', 'reconciliationrequired'].includes(
    status.toLocaleLowerCase('en'),
  );
}

function pointStatusMessage(payment: PointCardPayment | null): string {
  const status = payment?.status.toLocaleLowerCase('en');
  if (status === 'approved')
    return 'El pago fue acreditado. Verifica la venta antes de iniciar otro cobro.';
  if (status === 'cancelled') return 'El cobro fue cancelado en la terminal.';
  if (status === 'expired') return 'La orden de cobro expiró. Puedes intentarlo nuevamente.';
  if (status === 'reconciliationrequired')
    return 'Mercado Pago aprobó el cobro, pero la venta requiere conciliación administrativa.';
  return 'El pago con tarjeta no fue aprobado.';
}
