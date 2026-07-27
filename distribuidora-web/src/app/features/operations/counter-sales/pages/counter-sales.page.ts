import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { UiAlertComponent } from '../../../../shared/ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiIconButtonComponent } from '../../../../shared/ui/button/ui-icon-button.component';
import { UiFeedbackComponent } from '../../../../shared/ui/feedback/ui-feedback.component';
import { UiIconComponent } from '../../../../shared/ui/icon/ui-icon.component';
import { UiPageHeaderComponent } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiStatusChipComponent } from '../../../../shared/ui/status-chip/ui-status-chip.component';
import { CounterSalesApiAdapter } from '../data-access/counter-sales-api.adapter';
import { CounterSalesStore } from '../data-access/counter-sales.store';
import { CounterSale, CreateCounterSale, PosCustomer } from '../models/counter-sale.models';
import { ProductTileComponent } from '../ui/product-tile/product-tile.component';

type SaleAction = 'payment' | 'cancel' | null;

@Component({
  selector: 'app-counter-sales-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    UiAlertComponent,
    UiButtonComponent,
    UiIconButtonComponent,
    UiFeedbackComponent,
    UiIconComponent,
    UiPageHeaderComponent,
    UiStatusChipComponent,
    ProductTileComponent,
  ],
  providers: [CounterSalesApiAdapter, CounterSalesStore],
  template: `
    <div class="page pos-page">
      <app-ui-page-header
        eyebrow="Ventas"
        title="Punto de venta"
        subtitle="Agrega productos, cobra y entrega el comprobante desde una sola pantalla."
      >
        <app-ui-button
          [label]="view() === 'sale' ? 'Ver historial' : 'Nueva venta'"
          [icon]="view() === 'sale' ? 'history' : 'add'"
          variant="outlined"
          (pressed)="switchView()"
        />
      </app-ui-page-header>

      @if (store.error()) {
        <app-ui-alert
          title="No pudimos completar la operación"
          [message]="store.error()!.message"
          tone="danger"
          [correlationId]="store.error()!.correlationId"
          actionLabel="Reintentar"
          (action)="store.load()"
        />
      }
      @if (store.notice()) {
        <app-ui-alert title="Listo" [message]="store.notice()!" tone="success" />
      }
      @if (store.stockNotice()) {
        <app-ui-alert
          title="Revisa la existencia"
          [message]="store.stockNotice()!"
          tone="warning"
        />
      }

      @if (store.loading()) {
        <section class="surface">
          <app-ui-feedback
            kind="loading"
            title="Preparando el punto de venta"
            message="Cargando productos, clientes y formas de pago."
          />
        </section>
      } @else if (view() === 'sale') {
        <section class="sale-layout">
          <div class="sale-main">
            <mat-card appearance="outlined" class="sale-settings">
              <mat-card-content [formGroup]="saleForm">
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Almacén de salida</mat-label>
                  <mat-select formControlName="sourceWarehouseId">
                    @for (warehouse of store.warehouses(); track warehouse.id) {
                      <mat-option [value]="warehouse.id">
                        {{ warehouseLabel(warehouse.name) }}
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Cliente</mat-label>
                  <input
                    matInput
                    type="search"
                    autocomplete="off"
                    placeholder="Nombre o número celular"
                    [formControl]="customerSearchControl"
                    [matAutocomplete]="customerAutocomplete"
                    (input)="searchCustomers($event)"
                  />
                  <mat-autocomplete
                    #customerAutocomplete="matAutocomplete"
                    [displayWith]="displayCustomer"
                    (optionSelected)="selectCustomer($event)"
                  >
                    <mat-option value="">Venta al público</mat-option>
                    @for (customer of store.customers(); track customer.id) {
                      <mat-option [value]="customer.id" [disabled]="customer.creditBlocked">
                        <span class="customer-option">
                          <strong>{{ customer.name }}</strong>
                          @if (customer.phone) {
                            <small>{{ customer.phone }}</small>
                          }
                          @if (customer.creditBlocked) {
                            <small>Crédito bloqueado</small>
                          }
                        </span>
                      </mat-option>
                    }
                    @if (store.customersLoading()) {
                      <mat-option disabled>Buscando clientes…</mat-option>
                    } @else if (store.customers().length === 0) {
                      <mat-option disabled>No encontramos clientes.</mat-option>
                    }
                  </mat-autocomplete>
                  <mat-hint>Escribe el nombre o celular para filtrar.</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Condición de pago</mat-label>
                  <mat-select formControlName="paymentCondition">
                    <mat-option [value]="0">Contado</mat-option>
                    <mat-option [value]="1">Crédito</mat-option>
                    <mat-option [value]="2">Mixto</mat-option>
                  </mat-select>
                </mat-form-field>
              </mat-card-content>
            </mat-card>

            <section class="surface product-picker">
              <div class="section-heading">
                <div>
                  <h2 class="section-title">Agregar productos</h2>
                  <p>Busca por nombre, SKU o código de barras.</p>
                </div>
                <span class="shortcut">F2 Buscar</span>
              </div>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="product-search">
                <mat-label>Buscar producto</mat-label>
                <input
                  matInput
                  type="search"
                  autocomplete="off"
                  placeholder="Ej. ARZ-001 o arroz"
                  (input)="store.search(inputValue($event))"
                />
              </mat-form-field>
              @if (store.products().length === 0) {
                <div class="compact-empty">No encontramos productos con esa búsqueda.</div>
              } @else {
                <div class="product-grid">
                  @for (product of store.products(); track product.id) {
                    <app-product-tile
                      [product]="product"
                      [available]="store.availableStock(product.id)"
                      [canAdd]="store.canAdd(product.id)"
                      (add)="store.add(product)"
                    />
                  }
                </div>
              }
            </section>

            <section class="surface cart">
              <div class="section-heading">
                <div>
                  <h2 class="section-title">Productos de la venta</h2>
                  <p>
                    {{ store.lines().length }}
                    {{ store.lines().length === 1 ? 'partida' : 'partidas' }}
                  </p>
                </div>
                @if (store.lines().length > 0) {
                  <button matButton type="button" class="quiet-danger" (click)="store.clear()">
                    Vaciar
                  </button>
                }
              </div>

              @if (store.lines().length === 0) {
                <div class="cart-empty">
                  <span><app-ui-icon name="empty" /></span>
                  <strong>La venta está vacía</strong>
                  <p>Selecciona un producto para comenzar.</p>
                </div>
              } @else {
                <div class="cart-lines">
                  @for (line of store.lines(); track line.productId) {
                    <article class="cart-line">
                      <div class="cart-line__product">
                        <span>{{ line.sku }}</span>
                        <strong>{{ line.name }}</strong>
                        <small>{{ line.unitPrice | currency: 'MXN' }} c/u</small>
                        <small class="cart-line__stock">
                          Disponible: {{ store.availableStock(line.productId) | number: '1.0-4' }}
                        </small>
                      </div>
                      <div class="quantity" aria-label="Cantidad">
                        <button
                          matIconButton
                          type="button"
                          [attr.aria-label]="'Restar una unidad de ' + line.name"
                          (click)="store.changeQuantity(line.productId, line.quantity - 1)"
                        >
                          <app-ui-icon name="minus" />
                        </button>
                        <input
                          type="number"
                          min="0.01"
                          step="1"
                          [max]="store.availableStock(line.productId)"
                          [attr.aria-label]="'Cantidad de ' + line.name"
                          [value]="line.quantity"
                          (change)="changeLineQuantity(line.productId, $event)"
                        />
                        <button
                          matIconButton
                          type="button"
                          [attr.aria-label]="'Agregar una unidad de ' + line.name"
                          [disabled]="!store.canAdd(line.productId)"
                          (click)="store.changeQuantity(line.productId, line.quantity + 1)"
                        >
                          <app-ui-icon name="add" />
                        </button>
                      </div>
                      <strong class="line-total money">
                        {{ line.quantity * line.unitPrice - line.discount | currency: 'MXN' }}
                      </strong>
                      <app-ui-icon-button
                        class="remove-line"
                        icon="close"
                        [ariaLabel]="'Quitar ' + line.name"
                        (pressed)="store.remove(line.productId)"
                      />
                    </article>
                  }
                </div>
              }
            </section>
          </div>

          <aside class="surface checkout">
            <div>
              <span class="checkout__eyebrow">
                {{ store.editingSaleId() ? 'Editando borrador' : 'Resumen de venta' }}
              </span>
              <h2>Total a cobrar</h2>
              <strong class="checkout__total money">{{ total() | currency: 'MXN' }}</strong>
            </div>

            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{{ store.subtotal() | currency: 'MXN' }}</dd>
              </div>
              <div>
                <dt>Descuento</dt>
                <dd>− {{ store.discount() | currency: 'MXN' }}</dd>
              </div>
              <div>
                <dt>Impuestos</dt>
                <dd>{{ tax() | currency: 'MXN' }}</dd>
              </div>
            </dl>

            <form [formGroup]="paymentForm" class="checkout-form">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Impuestos</mat-label>
                <span matTextPrefix>$&nbsp;</span>
                <input
                  matInput
                  type="number"
                  min="0"
                  formControlName="tax"
                  (input)="setTax($event)"
                />
              </mat-form-field>
              @if (saleForm.controls.paymentCondition.value !== 1) {
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Forma de pago</mat-label>
                  <mat-select formControlName="method">
                    @for (method of store.paymentMethods(); track method.code) {
                      <mat-option [value]="method.code">
                        {{ paymentMethodLabel(method.code, method.name) }}
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                @if (selectedMethodRequiresReference()) {
                  <mat-form-field appearance="outline" subscriptSizing="dynamic">
                    <mat-label>Referencia</mat-label>
                    <input matInput formControlName="reference" />
                  </mat-form-field>
                }
              }
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Notas</mat-label>
                <textarea matInput rows="2" formControlName="notes"></textarea>
              </mat-form-field>
            </form>

            <div class="checkout-actions">
              <app-ui-button
                label="Cobrar y confirmar"
                loadingLabel="Procesando venta…"
                icon="check"
                [fullWidth]="true"
                [loading]="store.saving()"
                [disabled]="!canSave()"
                (pressed)="save(true)"
              />
              <app-ui-button
                label="Guardar borrador"
                variant="outlined"
                [fullWidth]="true"
                [disabled]="!canSave() || store.saving()"
                (pressed)="save(false)"
              />
            </div>
          </aside>
        </section>
      } @else {
        <section class="surface history">
          <div class="section-heading">
            <div>
              <h2 class="section-title">Ventas recientes</h2>
              <p>Consulta, completa o cancela operaciones anteriores.</p>
            </div>
            <app-ui-button
              label="Actualizar"
              icon="refresh"
              variant="outlined"
              (pressed)="store.load()"
            />
          </div>

          @if (store.sales().length === 0) {
            <app-ui-feedback
              kind="empty"
              title="Todavía no hay ventas"
              message="Las operaciones aparecerán aquí cuando registres la primera venta."
              actionLabel="Crear venta"
              (action)="view.set('sale')"
            />
          } @else {
            <div class="sales-list">
              @for (sale of store.sales(); track sale.id) {
                <article class="sale-row">
                  <div>
                    <strong>{{ sale.folio }}</strong>
                    <span>{{ sale.saleDate | date: 'dd MMM yyyy, HH:mm' }}</span>
                  </div>
                  <app-ui-status-chip
                    [label]="statusLabel(sale.status)"
                    [tone]="statusTone(sale.status)"
                  />
                  <div class="sale-row__amount">
                    <strong class="money">{{ sale.total | currency: 'MXN' }}</strong>
                    <span>Saldo {{ sale.balance | currency: 'MXN' }}</span>
                  </div>
                  <div class="sale-row__actions">
                    @if (isDraft(sale)) {
                      <button matButton type="button" (click)="resume(sale)">Continuar</button>
                      <button matButton="filled" type="button" (click)="store.confirmSale(sale)">
                        Confirmar
                      </button>
                    } @else if (sale.balance > 0 && !isCancelled(sale)) {
                      <button matButton type="button" (click)="openAction(sale, 'payment')">
                        Registrar pago
                      </button>
                    }
                    @if (!isCancelled(sale)) {
                      <button matButton type="button" (click)="store.print(sale, showTicket)">
                        Comprobante
                      </button>
                      <button
                        class="quiet-danger"
                        matButton
                        type="button"
                        (click)="openAction(sale, 'cancel')"
                      >
                        Cancelar
                      </button>
                    }
                  </div>
                </article>
              }
            </div>
          }
        </section>
      }
    </div>

    <ng-template #actionDialog>
      @if (activeSale() && activeAction()) {
        <section class="modal" aria-labelledby="sale-action-title">
          <div class="modal__header">
            <div>
              <span>{{ activeSale()!.folio }}</span>
              <h2 id="sale-action-title">
                {{ activeAction() === 'payment' ? 'Registrar pago' : 'Cancelar venta' }}
              </h2>
            </div>
            <app-ui-icon-button icon="close" ariaLabel="Cerrar" (pressed)="closeAction()" />
          </div>
          @if (activeAction() === 'payment') {
            <form [formGroup]="actionForm" class="modal__form">
              <mat-form-field appearance="outline">
                <mat-label>Forma de pago</mat-label>
                <mat-select formControlName="method">
                  @for (method of store.paymentMethods(); track method.code) {
                    <mat-option [value]="method.code">
                      {{ paymentMethodLabel(method.code, method.name) }}
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Importe</mat-label>
                <span matTextPrefix>$&nbsp;</span>
                <input matInput type="number" min="0.01" formControlName="amount" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Referencia</mat-label>
                <input matInput formControlName="reference" />
              </mat-form-field>
            </form>
          } @else {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Motivo de cancelación</mat-label>
              <textarea matInput rows="3" [formControl]="cancelReason"></textarea>
            </mat-form-field>
            <app-ui-alert
              title="Esta acción no se puede deshacer"
              message="El sistema revisará si la venta y sus movimientos pueden cancelarse."
              tone="warning"
            />
          }
          <div class="modal__actions">
            <app-ui-button label="Volver" variant="text" tone="neutral" (pressed)="closeAction()" />
            <app-ui-button
              [label]="activeAction() === 'payment' ? 'Registrar pago' : 'Cancelar venta'"
              [tone]="activeAction() === 'cancel' ? 'danger' : 'primary'"
              [loading]="store.saving()"
              [disabled]="actionInvalid()"
              (pressed)="submitAction()"
            />
          </div>
        </section>
      }
    </ng-template>

    <ng-template #ticketDialog>
      @if (ticket()) {
        <article class="ticket" aria-label="Comprobante de venta">
          <header>
            <span class="ticket__mark">D</span>
            <strong>Distribuidora</strong>
            <small>Comprobante de venta</small>
          </header>
          <div class="ticket__meta">
            <span>{{ ticket()!.folio }}</span>
            <span>{{ ticket()!.saleDate | date: 'dd/MM/yyyy HH:mm' }}</span>
          </div>
          @for (item of ticket()!.items; track item.productId) {
            <div class="ticket__line">
              <span>{{ item.quantity | number: '1.0-2' }} × {{ productName(item.productId) }}</span>
              <strong>{{
                item.quantity * item.unitPrice - item.discount | currency: 'MXN'
              }}</strong>
            </div>
          }
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{{ ticket()!.subtotal | currency: 'MXN' }}</dd>
            </div>
            <div>
              <dt>Impuestos</dt>
              <dd>{{ ticket()!.taxTotal | currency: 'MXN' }}</dd>
            </div>
            <div class="ticket__total">
              <dt>Total</dt>
              <dd>{{ ticket()!.total | currency: 'MXN' }}</dd>
            </div>
            <div>
              <dt>Pagado</dt>
              <dd>{{ ticket()!.paidAmount | currency: 'MXN' }}</dd>
            </div>
          </dl>
          <footer class="ticket__actions">
            <app-ui-button
              label="Cerrar"
              variant="text"
              tone="neutral"
              (pressed)="closeTicket()"
            />
            <app-ui-button label="Imprimir" icon="print" (pressed)="printTicket()" />
          </footer>
        </article>
      }
    </ng-template>
  `,
  styleUrl: './counter-sales.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterSalesPage implements OnInit {
  @ViewChild('actionDialog') private actionDialogTemplate!: TemplateRef<unknown>;
  @ViewChild('ticketDialog') private ticketDialogTemplate!: TemplateRef<unknown>;

  private readonly dialog = inject(MatDialog);
  private actionDialogRef: MatDialogRef<unknown> | null = null;
  private ticketDialogRef: MatDialogRef<unknown> | null = null;
  protected readonly store = inject(CounterSalesStore);
  protected readonly view = signal<'sale' | 'history'>('sale');
  protected readonly activeSale = signal<CounterSale | null>(null);
  protected readonly activeAction = signal<SaleAction>(null);
  protected readonly ticket = signal<CounterSale | null>(null);
  protected readonly tax = signal(0);
  protected readonly saleForm = new FormGroup({
    sourceWarehouseId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    customerId: new FormControl('', { nonNullable: true }),
    paymentCondition: new FormControl(0, { nonNullable: true }),
  });
  protected readonly customerSearchControl = new FormControl('', { nonNullable: true });
  protected readonly paymentForm = new FormGroup({
    tax: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    method: new FormControl('cash', { nonNullable: true }),
    reference: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });
  protected readonly actionForm = new FormGroup({
    method: new FormControl('cash', { nonNullable: true, validators: [Validators.required] }),
    amount: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    reference: new FormControl('', { nonNullable: true }),
  });
  protected readonly cancelReason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(3)],
  });
  protected readonly total = computed(() =>
    Math.max(
      0,
      storeNumber(this.store.subtotal()) - storeNumber(this.store.discount()) + this.tax(),
    ),
  );
  protected readonly showTicket = (sale: CounterSale) => {
    this.ticket.set(sale);
    this.ticketDialogRef = this.dialog.open(this.ticketDialogTemplate, {
      width: '25rem',
      maxWidth: 'calc(100vw - 2rem)',
      autoFocus: false,
      restoreFocus: true,
      panelClass: 'ticket-dialog-panel',
    });
    this.ticketDialogRef.afterClosed().subscribe(() => {
      this.ticket.set(null);
      this.ticketDialogRef = null;
    });
  };
  protected readonly displayCustomer = (customerId: string): string => {
    if (!customerId) return '';
    const customer = this.store.customers().find((item) => item.id === customerId);
    return customer ? this.customerLabel(customer) : customerId;
  };

  constructor() {
    this.saleForm.controls.sourceWarehouseId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((warehouseId) => this.store.selectWarehouse(warehouseId));
    effect(() => {
      const warehouses = this.store.warehouses();
      if (!this.saleForm.controls.sourceWarehouseId.value && warehouses.length > 0) {
        this.saleForm.controls.sourceWarehouseId.setValue(warehouses[0].id);
      }
      const methods = this.store.paymentMethods();
      if (
        methods.length > 0 &&
        !methods.some((method) => method.code === this.paymentForm.controls.method.value)
      ) {
        this.paymentForm.controls.method.setValue(methods[0].code);
      }
    });
  }

  ngOnInit(): void {
    this.store.load();
  }

  protected switchView(): void {
    this.view.update((current) => (current === 'sale' ? 'history' : 'sale'));
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected searchCustomers(event: Event): void {
    this.saleForm.controls.customerId.setValue('');
    this.store.searchCustomers(this.inputValue(event));
  }

  protected selectCustomer(event: MatAutocompleteSelectedEvent): void {
    const customerId = typeof event.option.value === 'string' ? event.option.value : '';
    this.saleForm.controls.customerId.setValue(customerId);
  }

  protected customerLabel(customer: PosCustomer): string {
    return customer.phone ? `${customer.name} · ${customer.phone}` : customer.name;
  }

  protected numericValue(event: Event): number {
    return Number((event.target as HTMLInputElement).value) || 0;
  }

  protected changeLineQuantity(productId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.store.changeQuantity(productId, Number(input.value) || 0);
    input.value = String(
      this.store.lines().find((line) => line.productId === productId)?.quantity ?? '',
    );
  }

  protected setTax(event: Event): void {
    this.tax.set(Math.max(0, this.numericValue(event)));
  }

  protected selectedMethodRequiresReference(): boolean {
    const code = this.paymentForm.controls.method.value;
    return (
      this.store.paymentMethods().find((method) => method.code === code)?.requiresReference ?? false
    );
  }

  protected canSave(): boolean {
    const isCredit = this.saleForm.controls.paymentCondition.value === 1;
    const referenceMissing =
      this.selectedMethodRequiresReference() && !this.paymentForm.controls.reference.value.trim();
    return (
      this.saleForm.valid &&
      this.store.lines().length > 0 &&
      this.store.hasValidStock() &&
      (!isCredit || Boolean(this.saleForm.controls.customerId.value)) &&
      (isCredit || !referenceMissing)
    );
  }

  protected save(confirm: boolean): void {
    if (!this.canSave()) return;
    const condition = this.saleForm.controls.paymentCondition.value;
    const paymentAmount = condition === 1 ? 0 : this.total();
    const request: CreateCounterSale = {
      customerId: this.saleForm.controls.customerId.value || null,
      sourceWarehouseId: this.saleForm.controls.sourceWarehouseId.value,
      paymentCondition: condition,
      taxTotal: this.tax(),
      notes: this.paymentForm.controls.notes.value.trim() || null,
      items: this.store.lines().map(({ productId, quantity, unitPrice, discount }) => ({
        productId,
        quantity,
        unitPrice,
        discount,
      })),
      payments:
        paymentAmount > 0
          ? [
              {
                method: this.paymentForm.controls.method.value,
                amount: paymentAmount,
                reference: this.paymentForm.controls.reference.value.trim() || null,
              },
            ]
          : [],
    };
    this.store.save(request, confirm, this.showTicket);
  }

  protected resume(sale: CounterSale): void {
    this.store.resume(sale);
    this.saleForm.patchValue({
      sourceWarehouseId: sale.sourceWarehouseId,
      customerId: sale.customerId ?? '',
      paymentCondition: paymentConditionValue(sale.paymentCondition),
    });
    this.paymentForm.patchValue({ tax: sale.taxTotal, notes: sale.notes ?? '' });
    this.customerSearchControl.setValue(sale.customerId ?? '');
    this.tax.set(sale.taxTotal);
    this.view.set('sale');
  }

  protected openAction(sale: CounterSale, action: Exclude<SaleAction, null>): void {
    this.activeSale.set(sale);
    this.activeAction.set(action);
    this.cancelReason.reset('');
    this.actionForm.reset({
      method: this.store.paymentMethods()[0]?.code ?? 'cash',
      amount: sale.balance,
      reference: '',
    });
    this.actionDialogRef = this.dialog.open(this.actionDialogTemplate, {
      width: '32rem',
      maxWidth: 'calc(100vw - 2rem)',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    this.actionDialogRef.afterClosed().subscribe(() => {
      this.activeSale.set(null);
      this.activeAction.set(null);
      this.actionDialogRef = null;
    });
  }

  protected closeAction(): void {
    this.actionDialogRef?.close();
    this.activeSale.set(null);
    this.activeAction.set(null);
  }

  protected closeTicket(): void {
    this.ticketDialogRef?.close();
  }

  protected actionInvalid(): boolean {
    return this.activeAction() === 'payment' ? this.actionForm.invalid : this.cancelReason.invalid;
  }

  protected submitAction(): void {
    const sale = this.activeSale();
    if (!sale || this.actionInvalid()) return;
    if (this.activeAction() === 'payment') {
      const value = this.actionForm.getRawValue();
      this.store.addPayment(sale, {
        method: value.method,
        amount: value.amount,
        reference: value.reference.trim() || null,
      });
    } else {
      this.store.cancelSale(sale, this.cancelReason.value.trim());
    }
    this.closeAction();
  }

  protected isDraft(sale: CounterSale): boolean {
    return sale.status.toLocaleLowerCase('en') === 'draft';
  }

  protected isCancelled(sale: CounterSale): boolean {
    return sale.status.toLocaleLowerCase('en') === 'cancelled';
  }

  protected statusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Borrador',
      confirmed: 'Confirmada',
      partiallypaid: 'Pago parcial',
      paid: 'Pagada',
      cancelled: 'Cancelada',
    };
    return labels[status.toLocaleLowerCase('en').replace(/\s/g, '')] ?? status;
  }

  protected warehouseLabel(name: string): string {
    return name.trim().toLowerCase() === 'main warehouse' ? 'Almacén principal' : name;
  }

  protected paymentMethodLabel(code: string, name: string): string {
    const normalized = code.trim().toLowerCase();
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia',
      check: 'Cheque',
    };

    return labels[normalized] ?? name;
  }

  protected statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
    const normalized = status.toLocaleLowerCase('en');
    if (normalized === 'cancelled') return 'danger';
    if (normalized === 'draft' || normalized.includes('partial')) return 'warning';
    if (normalized === 'confirmed' || normalized === 'paid') return 'success';
    return 'neutral';
  }

  protected productName(id: string): string {
    return this.store.products().find((product) => product.id === id)?.name ?? 'Producto';
  }

  protected printTicket(): void {
    window.print();
  }
}

function paymentConditionValue(value: string): number {
  const normalized = value.toLocaleLowerCase('en');
  if (normalized === 'credit') return 1;
  if (normalized === 'mixed') return 2;
  return 0;
}

function storeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
