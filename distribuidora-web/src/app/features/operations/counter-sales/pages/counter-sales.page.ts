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
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
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
import { ActivatedRoute } from '@angular/router';
import { startWith } from 'rxjs';
import { UiAlertComponent } from '../../../../shared/ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiIconButtonComponent } from '../../../../shared/ui/button/ui-icon-button.component';
import { UiFeedbackComponent } from '../../../../shared/ui/feedback/ui-feedback.component';
import { UiDateFieldComponent } from '../../../../shared/ui/date-field/ui-date-field.component';
import { UiIconComponent } from '../../../../shared/ui/icon/ui-icon.component';
import { UiPageHeaderComponent } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiStatusChipComponent } from '../../../../shared/ui/status-chip/ui-status-chip.component';
import { CounterSalesApiAdapter } from '../data-access/counter-sales-api.adapter';
import { CounterSalesStore } from '../data-access/counter-sales.store';
import { CounterSale, CreateCounterSale, IssueElectronicInvoice, PosCustomer } from '../models/counter-sale.models';
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
    UiDateFieldComponent,
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
          [operationId]="store.error()!.operationId"
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
                      (addAll)="store.addAll(product)"
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
                          [attr.aria-label]="'Aumentar cantidad de ' + line.name"
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

            @if (store.cardPayment()) {
              <section class="terminal-status" aria-live="polite">
                <app-ui-alert
                  title="Terminal Mercado Pago"
                  [message]="pointPaymentMessage()"
                  [tone]="pointPaymentTone()"
                />
                @if (canCancelPointPayment()) {
                  <app-ui-button
                    label="Cancelar cobro en terminal"
                    loadingLabel="Cancelando en terminal…"
                    icon="close"
                    variant="outlined"
                    tone="danger"
                    permission="sales.register_payment"
                    [fullWidth]="true"
                    [loading]="store.terminalCancelling()"
                    ariaLabel="Cancelar el cobro pendiente y liberar la terminal"
                    (pressed)="openTerminalCancellation()"
                  />
                }
              </section>
            }

            <div class="checkout-actions">
              <app-ui-button
                [label]="isPointCardSelected() ? 'Cobrar en terminal' : 'Cobrar y confirmar'"
                loadingLabel="Procesando venta…"
                [icon]="isPointCardSelected() ? 'point-of-sale' : 'check'"
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

          <form class="history-filters" [formGroup]="historyForm">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="history-filters__search">
              <mat-label>Buscar ventas</mat-label>
              <input
                matInput
                type="search"
                autocomplete="off"
                formControlName="query"
                placeholder="Folio, cliente, producto o nota"
              />
              <mat-hint>No necesitas conocer el ID de la venta.</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Estado</mat-label>
              <mat-select formControlName="status">
                <mat-option value="">Todos</mat-option>
                <mat-option value="draft">Borrador</mat-option>
                <mat-option value="confirmed">Confirmada</mat-option>
                <mat-option value="partiallypaid">Pago parcial</mat-option>
                <mat-option value="paid">Pagada</mat-option>
                <mat-option value="cancelled">Cancelada</mat-option>
              </mat-select>
            </mat-form-field>
            <app-ui-date-field label="Desde" formControlName="from" />
            <app-ui-date-field label="Hasta" formControlName="to" />
            <app-ui-button
              label="Limpiar filtros"
              variant="text"
              tone="neutral"
              [disabled]="activeHistoryFilterCount() === 0"
              (pressed)="clearHistoryFilters()"
            />
          </form>

          <p class="history-summary" aria-live="polite">
            {{ filteredSales().length }}
            {{ filteredSales().length === 1 ? 'venta encontrada' : 'ventas encontradas' }}
            @if (activeHistoryFilterCount() > 0) {
              <span>
                · {{ activeHistoryFilterCount() }}
                {{ activeHistoryFilterCount() === 1 ? 'filtro activo' : 'filtros activos' }}
              </span>
            }
          </p>

          @if (store.sales().length === 0) {
            <app-ui-feedback
              kind="empty"
              title="Todavía no hay ventas"
              message="Las operaciones aparecerán aquí cuando registres la primera venta."
              actionLabel="Crear venta"
              (action)="view.set('sale')"
            />
          } @else if (filteredSales().length === 0) {
            <app-ui-feedback
              kind="empty"
              title="No encontramos ventas"
              message="Prueba otro folio, cliente, producto, estado o periodo."
              actionLabel="Limpiar filtros"
              (action)="clearHistoryFilters()"
            />
          } @else {
            <div class="sales-list">
              @for (sale of filteredSales(); track sale.id) {
                <article class="sale-row">
                  <div>
                    <strong>{{ sale.folio }}</strong>
                    <span>{{ sale.saleDate | date: 'dd MMM yyyy, HH:mm' }}</span>
                    <span>{{ customerName(sale.customerId) }}</span>
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
                    <button
                      class="sale-action sale-action--detail"
                      matButton
                      type="button"
                      [attr.aria-label]="'Ver detalle de ' + sale.folio"
                      [attr.aria-expanded]="expandedSaleId() === sale.id"
                      (click)="toggleSaleDetails(sale.id)"
                    >
                      {{ expandedSaleId() === sale.id ? 'Ocultar detalle' : 'Ver detalle' }}
                    </button>
                    @if (isDraft(sale)) {
                      <button class="sale-action sale-action--continue" matButton type="button" (click)="resume(sale)">Continuar</button>
                      <button class="sale-action sale-action--confirm" matButton="filled" type="button" (click)="store.confirmSale(sale)">
                        Confirmar
                      </button>
                    } @else if (sale.balance > 0 && !isCancelled(sale)) {
                      <button class="sale-action sale-action--continue" matButton type="button" (click)="openAction(sale, 'payment')">
                        Registrar pago
                      </button>
                    }
                    @if (!isCancelled(sale)) {
                      @if (!isDraft(sale)) {
                        <app-ui-button
                          class="sale-action sale-action--invoice"
                          label="Factura"
                          icon="receipt"
                          variant="text"
                          permission="sales.invoice"
                          [disabled]="store.saving()"
                          (pressed)="openInvoice(sale)"
                        />
                      }
                      <button class="sale-action sale-action--receipt" matButton type="button" (click)="store.print(sale, showTicket)">
                        Comprobante
                      </button>
                      <button
                        class="quiet-danger sale-action sale-action--cancel"
                        matButton
                        type="button"
                        (click)="openAction(sale, 'cancel')"
                      >
                        Cancelar
                      </button>
                    }
                  </div>
                  @if (expandedSaleId() === sale.id) {
                    <section class="sale-detail" [attr.aria-label]="'Detalle de ' + sale.folio">
                      <h3>Detalle de {{ sale.folio }}</h3>
                      <dl class="sale-detail__summary">
                        <div><dt>Cliente</dt><dd>{{ customerName(sale.customerId) }}</dd></div>
                        <div><dt>Condición</dt><dd>{{ paymentConditionLabel(sale.paymentCondition) }}</dd></div>
                        <div><dt>Subtotal</dt><dd>{{ sale.subtotal | currency: 'MXN' }}</dd></div>
                        <div><dt>Impuestos</dt><dd>{{ sale.taxTotal | currency: 'MXN' }}</dd></div>
                        <div><dt>Pagado</dt><dd>{{ sale.paidAmount | currency: 'MXN' }}</dd></div>
                        <div><dt>Saldo</dt><dd>{{ sale.balance | currency: 'MXN' }}</dd></div>
                      </dl>
                      <div class="sale-detail__items">
                        @for (item of sale.items; track item.productId) {
                          <div>
                            <span>{{ productLabel(item.productId) }}</span>
                            <span>{{ item.quantity | number: '1.0-4' }} × {{ item.unitPrice | currency: 'MXN' }}</span>
                            <strong>{{ item.quantity * item.unitPrice - item.discount | currency: 'MXN' }}</strong>
                          </div>
                        }
                      </div>
                      @if (sale.notes) {
                        <p><strong>Notas:</strong> {{ sale.notes }}</p>
                      }
                    </section>
                  }
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

    <ng-template #terminalCancellationDialog>
      <section class="modal terminal-cancel-modal" aria-labelledby="terminal-cancel-title">
        <div class="modal__header">
          <div>
            <span>Terminal Mercado Pago</span>
            <h2 id="terminal-cancel-title">¿Cancelar el cobro pendiente?</h2>
          </div>
          <app-ui-icon-button
            icon="close"
            ariaLabel="Mantener el cobro pendiente"
            [disabled]="store.terminalCancelling()"
            (pressed)="closeTerminalCancellation()"
          />
        </div>
        <p class="terminal-cancel-modal__copy">
          La orden se retirará de la terminal para permitir otro cobro. La venta seguirá como
          borrador y los productos permanecerán en el carrito.
        </p>
        <app-ui-alert
          title="Verifica la terminal antes de continuar"
          message="Si el cliente ya presentó su tarjeta, espera el resultado para evitar un cobro duplicado."
          tone="warning"
        />
        <div class="modal__actions terminal-cancel-modal__actions">
          <app-ui-button
            label="Mantener cobro"
            variant="text"
            tone="neutral"
            [disabled]="store.terminalCancelling()"
            (pressed)="closeTerminalCancellation()"
          />
          <app-ui-button
            label="Sí, cancelar en terminal"
            loadingLabel="Liberando terminal…"
            tone="danger"
            [loading]="store.terminalCancelling()"
            (pressed)="confirmTerminalCancellation()"
          />
        </div>
      </section>
    </ng-template>

    <ng-template #invoiceDialog>
      @if (invoiceSale()) {
        <section class="modal invoice-modal" aria-labelledby="invoice-title">
          <div class="modal__header">
            <div>
              <span>{{ invoiceSale()!.folio }}</span>
              <h2 id="invoice-title">Factura electrónica</h2>
            </div>
            <app-ui-icon-button icon="close" ariaLabel="Cerrar factura" (pressed)="closeInvoice()" />
          </div>

          @if (!invoiceSale()!.customerId) {
            @if (store.billingEligibility(); as eligibility) {
              @if (eligibility.requiredAction === 'assign_billing_recipient') {
                <section class="fiscal-product-card" [formGroup]="billingRecipientForm">
                  <div>
                    <h3>Receptor fiscal</h3>
                    <p>La venta original seguirá registrada como venta al público.</p>
                  </div>
                  <mat-form-field appearance="outline">
                    <mat-label>Buscar cliente</mat-label>
                    <input matInput formControlName="search" autocomplete="off" (input)="searchBillingCustomers()" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Cliente que solicita la factura</mat-label>
                    <mat-select formControlName="customerId" (selectionChange)="applyBillingCustomer()">
                      @for (customer of store.customers(); track customer.id) {
                        <mat-option [value]="customer.id">
                          {{ customer.name }}{{ customer.taxId ? ' · ' + customer.taxId : '' }}
                        </mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  @if (selectedBillingCustomer() && !selectedBillingCustomer()!.hasCompleteFiscalProfile) {
                    <app-ui-alert
                      title="Perfil fiscal incompleto"
                      message="Completa RFC, razón social, código postal y régimen en Clientes antes de asociarlo."
                      tone="warning"
                    />
                  }
                  <mat-form-field appearance="outline">
                    <mat-label>Motivo de asociación</mat-label>
                    <textarea matInput formControlName="reason" rows="2"></textarea>
                  </mat-form-field>
                  <app-ui-button
                    label="Asociar receptor fiscal"
                    icon="customers"
                    permission="sales.assign_billing_recipient"
                    [loading]="store.saving()"
                    [disabled]="billingRecipientForm.invalid || !selectedBillingCustomer()?.hasCompleteFiscalProfile"
                    (pressed)="assignBillingRecipient()"
                  />
                </section>
              } @else if (!eligibility.eligible && eligibility.requiredAction !== 'view_invoice') {
                <app-ui-alert
                  title="La venta requiere revisión fiscal"
                  [message]="billingEligibilityMessage(eligibility.reasonCode)"
                  tone="warning"
                />
                @if (eligibility.requiredAction === 'reconcile_fiscal_coverage') {
                  <section class="fiscal-product-card" [formGroup]="fiscalReconciliationForm">
                    <div>
                      <h3>Conciliación administrativa</h3>
                      <p>Registra el resultado verificado contra la fuente fiscal externa.</p>
                    </div>
                    <mat-form-field appearance="outline">
                      <mat-label>Cobertura verificada</mat-label>
                      <mat-select formControlName="coverageStatus">
                        <mat-option value="Uncovered">No incluida en factura global</mat-option>
                        <mat-option value="IncludedInOpenGlobalInvoice">Incluida en global abierta</mat-option>
                        <mat-option value="IncludedInIssuedGlobalInvoice">Incluida en global emitida</mat-option>
                      </mat-select>
                    </mat-form-field>
                    @if (fiscalReconciliationForm.controls.coverageStatus.value === 'IncludedInIssuedGlobalInvoice') {
                      <mat-form-field appearance="outline">
                        <mat-label>UUID de la factura global</mat-label>
                        <input matInput formControlName="globalInvoiceFiscalUuid" autocomplete="off" />
                      </mat-form-field>
                    }
                    <mat-form-field appearance="outline">
                      <mat-label>Evidencia o motivo de conciliación</mat-label>
                      <textarea matInput formControlName="reason" rows="3"></textarea>
                    </mat-form-field>
                    <app-ui-button
                      label="Guardar conciliación"
                      icon="audit"
                      variant="outlined"
                      permission="sales.manage_global_invoice_replacement"
                      [loading]="store.saving()"
                      [disabled]="fiscalReconciliationInvalid()"
                      (pressed)="reconcileFiscalCoverage()"
                    />
                  </section>
                }
              } @else if (eligibility.billingCustomerId) {
                <app-ui-alert
                  title="Receptor fiscal asociado"
                  [message]="'La factura se emitirá a ' + billingCustomerName(eligibility.billingCustomerId) + '. La venta original no se modificará.'"
                  tone="info"
                />
              }
            } @else {
              <app-ui-alert title="Verificando cobertura fiscal" message="Consultando el estado autoritativo de la venta." tone="info" />
            }
          }

          @if (store.electronicInvoice(); as invoice) {
            <div class="invoice-result">
              <app-ui-status-chip [label]="invoiceStatusLabel(invoice.status)" [tone]="invoiceStatusTone(invoice.status)" />
              @if (invoice.fiscalUuid) {
                <div class="invoice-uuid"><span>Folio fiscal</span><strong>{{ invoice.fiscalUuid }}</strong></div>
              }
              @if (invoice.errorMessage) {
                <app-ui-alert title="Requiere revisión" [message]="invoice.errorMessage" tone="warning" />
              }
              @if (canDownloadInvoice(invoice.status)) {
                <div class="invoice-file-actions">
                  <app-ui-button label="Descargar XML" icon="download" variant="outlined" [loading]="store.saving()" (pressed)="downloadInvoice('xml')" />
                  <app-ui-button label="Descargar PDF" icon="download" variant="outlined" [loading]="store.saving()" (pressed)="downloadInvoice('pdf')" />
                </div>
              }
              @if (invoice.status.toLowerCase() === 'issued') {
                <div class="invoice-cancel" [formGroup]="invoiceCancelForm">
                  <h3>Cancelar factura</h3>
                  <mat-form-field appearance="outline">
                    <mat-label>Motivo SAT</mat-label>
                    <mat-select formControlName="reasonCode">
                      <mat-option value="01">01 · Comprobante emitido con errores con relación</mat-option>
                      <mat-option value="02">02 · Comprobante emitido con errores sin relación</mat-option>
                      <mat-option value="03">03 · No se llevó a cabo la operación</mat-option>
                    </mat-select>
                  </mat-form-field>
                  @if (invoiceCancelForm.controls.reasonCode.value === '01') {
                    <mat-form-field appearance="outline">
                      <mat-label>UUID de la factura sustituta</mat-label>
                      <input matInput formControlName="replacementUuid" autocomplete="off" />
                    </mat-form-field>
                  }
                  <app-ui-button label="Cancelar CFDI" tone="danger" variant="outlined" permission="sales.cancel_invoice" [disabled]="invoiceCancellationInvalid()" [loading]="store.saving()" (pressed)="cancelInvoice()" />
                </div>
              }
            </div>
          } @else {
            <form [formGroup]="invoiceForm" class="invoice-form">
              <p class="form-intro">Captura los datos tal como aparecen en la constancia de situación fiscal.</p>
              <div class="invoice-form__grid">
                <mat-form-field appearance="outline"><mat-label>RFC</mat-label><input matInput formControlName="taxId" autocomplete="off" /></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Nombre o razón social</mat-label><input matInput formControlName="legalName" autocomplete="name" /></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Código postal fiscal</mat-label><input matInput formControlName="zipCode" inputmode="numeric" maxlength="5" /></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Régimen fiscal</mat-label><input matInput formControlName="taxRegimeCode" maxlength="3" placeholder="Ej. 612" /></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Uso CFDI</mat-label><input matInput formControlName="cfdiUseCode" maxlength="4" placeholder="Ej. G03" /></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Forma de pago SAT</mat-label><input matInput formControlName="paymentFormCode" maxlength="2" placeholder="Ej. 01" /></mat-form-field>
                <mat-form-field appearance="outline" class="span-two"><mat-label>Correo para la factura (opcional)</mat-label><input matInput type="email" formControlName="email" autocomplete="email" /></mat-form-field>
              </div>
              <div class="fiscal-product-card">
                <div><h3>Datos SAT de los productos</h3><p>Se aplicarán a todos los conceptos de esta venta.</p></div>
                <div class="invoice-form__grid">
                  <mat-form-field appearance="outline"><mat-label>Clave producto/servicio</mat-label><input matInput formControlName="satProductCode" maxlength="8" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Clave unidad</mat-label><input matInput formControlName="satUnitCode" maxlength="3" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Objeto de impuesto</mat-label><mat-select formControlName="taxObjectCode"><mat-option value="02">02 · Sí objeto de impuesto</mat-option><mat-option value="01">01 · No objeto de impuesto</mat-option></mat-select></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Tasa IVA</mat-label><mat-select formControlName="taxRate"><mat-option [value]="0.16">16%</mat-option><mat-option [value]="0.08">8%</mat-option><mat-option [value]="0">0%</mat-option></mat-select></mat-form-field>
                </div>
              </div>
              <app-ui-alert title="Revisa antes de timbrar" message="La emisión fiscal no se reintenta automáticamente. Verifica RFC, razón social y régimen." tone="info" />
            </form>
          }
          <div class="modal__actions">
            <app-ui-button label="Cerrar" variant="text" tone="neutral" (pressed)="closeInvoice()" />
            @if (!store.electronicInvoice()) {
              <app-ui-button label="Emitir factura" icon="receipt" permission="sales.invoice" [loading]="store.saving()" loadingLabel="Timbrando…" [disabled]="invoiceIssueDisabled()" (pressed)="issueInvoice()" />
            }
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
            <app-ui-button label="Cerrar" variant="text" tone="neutral" (pressed)="closeTicket()" />
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
  @ViewChild('invoiceDialog') private invoiceDialogTemplate!: TemplateRef<unknown>;
  @ViewChild('terminalCancellationDialog')
  private terminalCancellationDialogTemplate!: TemplateRef<unknown>;

  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private actionDialogRef: MatDialogRef<unknown> | null = null;
  private ticketDialogRef: MatDialogRef<unknown> | null = null;
  private invoiceDialogRef: MatDialogRef<unknown> | null = null;
  private terminalCancellationDialogRef: MatDialogRef<unknown> | null = null;
  protected readonly store = inject(CounterSalesStore);
  protected readonly view = signal<'sale' | 'history'>('sale');
  protected readonly activeSale = signal<CounterSale | null>(null);
  protected readonly activeAction = signal<SaleAction>(null);
  protected readonly expandedSaleId = signal<string | null>(null);
  protected readonly ticket = signal<CounterSale | null>(null);
  protected readonly invoiceSale = signal<CounterSale | null>(null);
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
  protected readonly historyForm = new FormGroup({
    query: new FormControl('', { nonNullable: true }),
    status: new FormControl('', { nonNullable: true }),
    from: new FormControl('', { nonNullable: true }),
    to: new FormControl('', { nonNullable: true }),
  });
  private readonly historyFilters = toSignal(
    this.historyForm.valueChanges.pipe(startWith(this.historyForm.getRawValue())),
    { initialValue: this.historyForm.getRawValue() },
  );
  protected readonly activeHistoryFilterCount = computed(() =>
    Object.values(this.historyFilters()).filter((value) => Boolean(value?.trim())).length,
  );
  protected readonly filteredSales = computed(() => {
    const filters = this.historyFilters();
    const query = filters.query?.trim().toLocaleLowerCase('es-MX') ?? '';
    const status = filters.status?.trim().toLocaleLowerCase('en').replace(/\s/g, '') ?? '';
    return this.store.sales().filter((sale) => {
      const saleDay = sale.saleDate.slice(0, 10);
      if (filters.from && saleDay < filters.from) return false;
      if (filters.to && saleDay > filters.to) return false;
      if (status && sale.status.toLocaleLowerCase('en').replace(/\s/g, '') !== status) return false;
      if (!query) return true;
      const searchable = [
        sale.folio,
        this.statusLabel(sale.status),
        this.customerName(sale.customerId),
        sale.notes ?? '',
        ...sale.items.flatMap((item) => [
          this.productLabel(item.productId),
          String(item.quantity),
        ]),
      ]
        .join(' ')
        .toLocaleLowerCase('es-MX');
      return searchable.includes(query);
    });
  });
  protected readonly cancelReason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(3)],
  });
  protected readonly invoiceForm = new FormGroup({
    taxId: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i)] }),
    legalName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(254)] }),
    zipCode: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{5}$/)] }),
    taxRegimeCode: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{3}$/)] }),
    cfdiUseCode: new FormControl('G03', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[A-Z0-9]{3,4}$/)] }),
    paymentFormCode: new FormControl('01', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{2}$/)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    satProductCode: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{8}$/)] }),
    satUnitCode: new FormControl('H87', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[A-Z0-9]{2,3}$/)] }),
    taxObjectCode: new FormControl('02', { nonNullable: true, validators: [Validators.required] }),
    taxRate: new FormControl(0.16, { nonNullable: true, validators: [Validators.required, Validators.min(0), Validators.max(1)] }),
  });
  protected readonly billingRecipientForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    customerId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    reason: new FormControl('El comprador regresó para solicitar su factura.', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(500)],
    }),
  });
  protected readonly fiscalReconciliationForm = new FormGroup({
    coverageStatus: new FormControl('Uncovered', { nonNullable: true, validators: [Validators.required] }),
    globalInvoiceFiscalUuid: new FormControl('', { nonNullable: true }),
    reason: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(1000)],
    }),
  });
  protected readonly invoiceCancelForm = new FormGroup({
    reasonCode: new FormControl('02', { nonNullable: true, validators: [Validators.required] }),
    replacementUuid: new FormControl('', { nonNullable: true }),
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
    const queryParams = this.route.snapshot.queryParamMap;
    if (queryParams.get('view') === 'history') {
      this.view.set('history');
      this.historyForm.patchValue({
        query: queryParams.get('query') ?? '',
        status: queryParams.get('status') ?? '',
        from: validDateParam(queryParams.get('from')),
        to: validDateParam(queryParams.get('to')),
      });
    }
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

  protected clearHistoryFilters(): void {
    this.historyForm.reset({ query: '', status: '', from: '', to: '' });
  }

  protected toggleSaleDetails(id: string): void {
    this.expandedSaleId.update((current) => (current === id ? null : id));
  }

  protected customerName(customerId?: string | null): string {
    if (!customerId) return 'Venta al público';
    return this.store.customers().find((customer) => customer.id === customerId)?.name ?? 'Cliente';
  }

  protected paymentConditionLabel(condition: string): string {
    const labels: Record<string, string> = { cash: 'Contado', credit: 'Crédito', mixed: 'Mixto' };
    return labels[condition.toLocaleLowerCase('en')] ?? condition;
  }

  protected productLabel(productId: string): string {
    const product = this.store.products().find((item) => item.id === productId);
    return product ? `${product.sku} · ${product.name}` : 'Producto';
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
    if (code.trim().toLowerCase() === 'card') return false;
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
    const pointCard = confirm && condition !== 1 && this.isPointCardSelected();
    const paymentAmount = condition === 1 || pointCard ? 0 : this.total();
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
    if (pointCard) {
      this.store.saveCard(request, this.showTicket);
      return;
    }
    this.store.save(request, confirm, this.showTicket);
  }

  protected isPointCardSelected(): boolean {
    return this.paymentForm.controls.method.value.trim().toLowerCase() === 'card';
  }

  protected pointPaymentMessage(): string {
    const payment = this.store.cardPayment();
    const status = payment?.status.toLocaleLowerCase('en');
    if (payment?.statusDetail === 'cancellation_requested')
      return 'Cancelación enviada. Esperando confirmación de Mercado Pago para liberar la terminal.';
    if (status === 'approved') return 'Pago aprobado. La venta quedó confirmada.';
    if (status === 'atterminal')
      return 'La terminal recibió el cobro. Solicita al cliente insertar, acercar o deslizar su tarjeta.';
    if (status === 'actionrequired') return 'Revisa la terminal para confirmar el resultado del cobro.';
    if (status === 'failed') return 'El pago fue rechazado. El carrito permanece disponible.';
    if (status === 'cancelled') return 'El cobro fue cancelado en la terminal.';
    if (status === 'expired') return 'La orden expiró sin completar el pago.';
    if (status === 'reconciliationrequired')
      return 'El cobro requiere conciliación administrativa. No vuelvas a cobrar.';
    return 'Orden enviada. Esperando que el cliente pague en la terminal.';
  }

  protected pointPaymentTone(): 'success' | 'warning' | 'danger' | 'info' {
    const status = this.store.cardPayment()?.status.toLocaleLowerCase('en');
    if (status === 'approved') return 'success';
    if (status === 'failed' || status === 'cancelled' || status === 'expired') return 'danger';
    if (status === 'actionrequired' || status === 'reconciliationrequired') return 'warning';
    return 'info';
  }

  protected canCancelPointPayment(): boolean {
    const payment = this.store.cardPayment();
    if (!payment?.orderId || payment.statusDetail === 'cancellation_requested') return false;
    return ['pending', 'atterminal', 'actionrequired'].includes(
      payment.status.toLocaleLowerCase('en'),
    );
  }

  protected openTerminalCancellation(): void {
    if (!this.canCancelPointPayment() || this.store.terminalCancelling()) return;
    this.terminalCancellationDialogRef = this.dialog.open(
      this.terminalCancellationDialogTemplate,
      {
        width: 'min(32rem, calc(100vw - 2rem))',
        maxWidth: '100vw',
        autoFocus: 'dialog',
        restoreFocus: true,
        disableClose: this.store.terminalCancelling(),
      },
    );
  }

  protected closeTerminalCancellation(): void {
    if (this.store.terminalCancelling()) return;
    this.terminalCancellationDialogRef?.close();
    this.terminalCancellationDialogRef = null;
  }

  protected confirmTerminalCancellation(): void {
    this.store.cancelCardPayment(() => this.closeTerminalCancellation());
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

  protected openInvoice(sale: CounterSale): void {
    this.invoiceSale.set(sale);
    this.store.resetElectronicInvoice();
    this.invoiceForm.reset({
      taxId: '', legalName: '', zipCode: '', taxRegimeCode: '', cfdiUseCode: 'G03',
      paymentFormCode: '01', email: '', satProductCode: '', satUnitCode: 'H87',
      taxObjectCode: '02', taxRate: 0.16,
    });
    this.invoiceCancelForm.reset({ reasonCode: '02', replacementUuid: '' });
    this.billingRecipientForm.reset({
      search: '', customerId: '', reason: 'El comprador regresó para solicitar su factura.',
    });
    this.fiscalReconciliationForm.reset({
      coverageStatus: 'Uncovered', globalInvoiceFiscalUuid: '', reason: '',
    });
    this.applyFiscalCustomer(sale.customerId ?? null);
    this.invoiceDialogRef = this.dialog.open(this.invoiceDialogTemplate, {
      width: '48rem', maxWidth: 'calc(100vw - 1rem)', maxHeight: 'calc(100dvh - 1rem)',
      autoFocus: 'first-tabbable', restoreFocus: true, panelClass: 'invoice-dialog-panel',
    });
    this.store.loadElectronicInvoice(sale, () => undefined);
    this.store.loadBillingEligibility(sale, (eligibility) => {
      if (eligibility.billingCustomerId) this.applyFiscalCustomer(eligibility.billingCustomerId);
    });
    this.invoiceDialogRef.afterClosed().subscribe(() => {
      this.invoiceSale.set(null); this.invoiceDialogRef = null; this.store.resetElectronicInvoice();
    });
  }

  protected closeInvoice(): void { this.invoiceDialogRef?.close(); }

  protected issueInvoice(): void {
    const sale = this.invoiceSale();
    if (!sale || this.invoiceIssueDisabled()) { this.invoiceForm.markAllAsTouched(); return; }
    const value = this.invoiceForm.getRawValue();
    const taxable = value.taxObjectCode === '02';
    const request: IssueElectronicInvoice = {
      paymentFormCode: value.paymentFormCode.trim(),
      recipient: {
        taxId: value.taxId.trim().toUpperCase(), legalName: value.legalName.trim().toUpperCase(),
        zipCode: value.zipCode.trim(), taxRegimeCode: value.taxRegimeCode.trim(),
        cfdiUseCode: value.cfdiUseCode.trim().toUpperCase(), email: value.email.trim() || null,
      },
      items: sale.items.map((item) => ({
        productId: item.productId, satProductCode: value.satProductCode.trim(),
        satUnitCode: value.satUnitCode.trim().toUpperCase(), taxObjectCode: value.taxObjectCode,
        taxes: taxable ? [{ taxCode: '002', taxTypeCode: 'Tasa', rate: value.taxRate, taxFlagCode: 'T' }] : [],
      })),
    };
    this.store.issueElectronicInvoice(sale, request, () => undefined);
  }

  protected selectedBillingCustomer(): PosCustomer | null {
    const customerId = this.billingRecipientForm.controls.customerId.value;
    return this.store.customers().find((customer) => customer.id === customerId) ?? null;
  }

  protected applyBillingCustomer(): void {
    this.applyFiscalCustomer(this.billingRecipientForm.controls.customerId.value || null);
  }

  protected searchBillingCustomers(): void {
    this.store.searchCustomers(this.billingRecipientForm.controls.search.value);
  }

  protected assignBillingRecipient(): void {
    const sale = this.invoiceSale();
    const customer = this.selectedBillingCustomer();
    if (!sale || !customer?.hasCompleteFiscalProfile || this.billingRecipientForm.invalid) {
      this.billingRecipientForm.markAllAsTouched();
      return;
    }
    this.store.assignBillingRecipient(
      sale,
      customer.id,
      this.billingRecipientForm.controls.reason.value,
      () => this.applyFiscalCustomer(customer.id),
    );
  }

  protected invoiceIssueDisabled(): boolean {
    const sale = this.invoiceSale();
    if (!sale || this.invoiceForm.invalid) return true;
    return !sale.customerId && this.store.billingEligibility()?.eligible !== true;
  }

  protected fiscalReconciliationInvalid(): boolean {
    const value = this.fiscalReconciliationForm.getRawValue();
    if (this.fiscalReconciliationForm.invalid) return true;
    return value.coverageStatus === 'IncludedInIssuedGlobalInvoice'
      && !/^[0-9a-f-]{36}$/i.test(value.globalInvoiceFiscalUuid.trim());
  }

  protected reconcileFiscalCoverage(): void {
    const sale = this.invoiceSale();
    if (!sale || this.fiscalReconciliationInvalid()) {
      this.fiscalReconciliationForm.markAllAsTouched();
      return;
    }
    const value = this.fiscalReconciliationForm.getRawValue();
    this.store.reconcileFiscalCoverage(sale, {
      coverageStatus: value.coverageStatus,
      reason: value.reason.trim(),
      globalInvoiceFiscalUuid: value.globalInvoiceFiscalUuid.trim() || null,
    }, () => undefined);
  }

  protected billingCustomerName(customerId: string): string {
    return this.store.customers().find((customer) => customer.id === customerId)?.name
      ?? 'el receptor seleccionado';
  }

  protected billingEligibilityMessage(reasonCode: string): string {
    const messages: Record<string, string> = {
      fiscal_coverage_unknown: 'La cobertura fiscal histórica no está conciliada. Un usuario fiscal debe revisarla antes de timbrar.',
      fiscal_reconciliation_required: 'Existe un resultado fiscal pendiente de conciliación. No se puede reenviar automáticamente.',
      included_in_open_global_invoice: 'La operación está incluida en una factura global abierta y debe excluirse primero.',
      included_in_issued_global_invoice: 'La operación ya pertenece a una factura global emitida. Se requiere el procedimiento fiscal con motivo SAT 04.',
      invoice_attempt_exists: 'Ya existe un intento de factura. Debe conciliarse antes de realizar otra emisión.',
    };
    return messages[reasonCode]
      ?? 'El backend bloqueó la emisión hasta completar la revisión fiscal.';
  }

  private applyFiscalCustomer(customerId: string | null): void {
    if (!customerId) return;
    const customer = this.store.customers().find((item) => item.id === customerId);
    if (!customer) return;
    this.invoiceForm.patchValue({
      taxId: customer.taxId,
      legalName: customer.fiscalLegalName,
      zipCode: customer.fiscalZipCode,
      taxRegimeCode: customer.taxRegimeCode,
      cfdiUseCode: customer.defaultCfdiUseCode || 'G03',
      email: customer.invoiceEmail,
    });
  }

  protected downloadInvoice(format: 'xml' | 'pdf'): void {
    const sale = this.invoiceSale();
    if (!sale) return;
    this.store.downloadElectronicInvoice(sale, format, (blob) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `${sale.folio}.${format}`; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    });
  }

  protected invoiceCancellationInvalid(): boolean {
    const value = this.invoiceCancelForm.getRawValue();
    return this.invoiceCancelForm.invalid || (value.reasonCode === '01' && !/^[0-9a-f-]{36}$/i.test(value.replacementUuid.trim()));
  }

  protected cancelInvoice(): void {
    const sale = this.invoiceSale();
    if (!sale || this.invoiceCancellationInvalid()) return;
    const value = this.invoiceCancelForm.getRawValue();
    this.store.cancelElectronicInvoice(sale, value.reasonCode, value.replacementUuid.trim() || null, () => undefined);
  }

  protected canDownloadInvoice(status: string): boolean { return ['issued', 'cancelled'].includes(status.toLowerCase()); }
  protected invoiceStatusLabel(status: string): string {
    return ({ pending: 'Procesando', issued: 'Emitida', failed: 'Requiere revisión', cancelled: 'Cancelada' } as Record<string, string>)[status.toLowerCase()] ?? status;
  }
  protected invoiceStatusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
    const value = status.toLowerCase();
    if (value === 'issued') return 'success';
    if (value === 'failed' || value === 'pending') return 'warning';
    if (value === 'cancelled') return 'danger';
    return 'neutral';
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

function validDateParam(value: string | null): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
}

function storeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
