import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink, type Params } from '@angular/router';
import { LanguageService } from '../../../core/i18n/language.service';
import { TranslationKey } from '../../../core/i18n/translation.catalog';
import { UiAlertComponent } from '../../../shared/ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';
import { UiFeedbackComponent } from '../../../shared/ui/feedback/ui-feedback.component';
import { UiIconComponent } from '../../../shared/ui/icon/ui-icon.component';
import { UiPageHeaderComponent } from '../../../shared/ui/page-header/ui-page-header.component';
import { DashboardStore } from '../data-access/dashboard.store';

interface AgingSegment {
  readonly label: string;
  readonly value: number;
  readonly percent: number;
  readonly color: string;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    UiAlertComponent,
    UiButtonComponent,
    UiFeedbackComponent,
    UiIconComponent,
    UiPageHeaderComponent,
    RouterLink,
  ],
  providers: [DashboardStore],
  template: `
    <div class="page dashboard-page">
      <app-ui-page-header
        data-tour="dashboard-summary"
        [eyebrow]="i18n.translate('dashboard.eyebrow')"
        [title]="i18n.translate('dashboard.title')"
        [subtitle]="i18n.translate('dashboard.subtitle')"
      >
        <app-ui-button
          [label]="i18n.translate('common.refresh')"
          variant="outlined"
          icon="refresh"
          (pressed)="store.load()"
        />
      </app-ui-page-header>

      @if (store.loading()) {
        <section class="surface">
          <app-ui-feedback
            kind="loading"
            [title]="i18n.translate('dashboard.loading')"
            [message]="i18n.translate('dashboard.loadingMessage')"
          />
        </section>
      } @else if (store.error()) {
        <app-ui-alert
          [title]="i18n.translate('dashboard.loadError')"
          [message]="store.error()!.message"
          tone="danger"
          [correlationId]="store.error()!.correlationId"
          [operationId]="store.error()!.operationId"
          [actionLabel]="i18n.translate('common.retry')"
          (action)="store.load()"
        />
      } @else if (store.metrics().length === 0) {
        <section class="surface">
          <app-ui-feedback
            kind="empty"
            [title]="i18n.translate('dashboard.noData')"
            [message]="i18n.translate('dashboard.noDataMessage')"
          />
        </section>
      } @else {
        <section class="executive-hero" data-tour="dashboard-quick-actions">
          <div>
            <span>{{ text('Pulso operativo', 'Operational pulse') }}</span>
            <h2>{{ executiveTitle() }}</h2>
            <p>{{ executiveMessage() }}</p>
          </div>
          <a routerLink="/operations/reports" class="hero-action">
            {{ text('Explorar reportes', 'Explore reports') }}
            <app-ui-icon name="open" />
          </a>
        </section>

        <section data-tour="dashboard-kpis" class="metrics" [attr.aria-label]="i18n.translate('dashboard.indicators')">
          @for (metric of store.metrics(); track metric.key; let index = $index) {
            <a
              class="metric"
              [class]="'metric metric--' + index"
              [routerLink]="destinationFor(metric.key)"
              [queryParams]="queryParamsFor(metric.key)"
              [attr.aria-label]="actionLabelFor(metric.key) + ': ' + metric.value"
            >
              <span class="metric__icon"><app-ui-icon [name]="metric.icon" /></span>
              <div class="metric__content">
                <span>{{ i18n.translate(metric.label) }}</span>
                <strong>
                  @if (metric.format === 'currency') {
                    {{ metric.value | currency: 'MXN' : 'symbol' : '1.2-2' }}
                  } @else {
                    {{ metric.value | number: '1.0-2' }}
                  }
                </strong>
                <span class="metric__action">
                  {{ actionLabelFor(metric.key) }}
                  <app-ui-icon name="open" />
                </span>
              </div>
            </a>
          }
        </section>

        <section class="analytics-grid">
          <article class="surface panel sales-panel">
            <header class="panel__header">
              <div>
                <span>{{ text('Últimos 7 días', 'Last 7 days') }}</span>
                <h2>{{ text('Ritmo de ventas', 'Sales pace') }}</h2>
                <p>{{ text('Ingreso confirmado por día', 'Confirmed revenue by day') }}</p>
              </div>
              <strong>{{ weeklySales() | currency: 'MXN' : 'symbol' : '1.0-0' }}</strong>
            </header>
            @if (store.salesTrend().length > 0) {
              <div
                class="sales-chart"
                role="img"
                [attr.aria-label]="
                  text('Ventas de los últimos siete días', 'Sales for the last seven days')
                "
              >
                @for (day of store.salesTrend(); track day.date) {
                  <div class="sales-column">
                    <span class="sales-column__value">{{
                      day.sales | currency: 'MXN' : 'symbol' : '1.0-0'
                    }}</span>
                    <div class="sales-column__track">
                      <i [style.height.%]="salesHeight(day.sales)"><span></span></i>
                    </div>
                    <strong>{{ day.date | date: 'EEE' : undefined : i18n.locale() }}</strong>
                    <small>{{ day.transactions }} {{ text('ops.', 'txns') }}</small>
                  </div>
                }
              </div>
            } @else {
              <div class="chart-empty">
                <app-ui-icon name="reports" />
                <span>{{
                  text(
                    'La tendencia aparecerá con la nueva respuesta del servidor.',
                    'The trend will appear with the new server response.'
                  )
                }}</span>
              </div>
            }
          </article>

          <article class="surface panel inventory-panel">
            <header class="panel__header">
              <div>
                <span>{{ text('Inventario', 'Inventory') }}</span>
                <h2>{{ text('Salud del catálogo', 'Catalog health') }}</h2>
                <p>{{ text('Productos por nivel de riesgo', 'Products by risk level') }}</p>
              </div>
            </header>
            <div class="health-content">
              <div
                class="health-donut"
                [style.background]="inventoryDonut()"
                role="img"
                [attr.aria-label]="inventoryHealthLabel()"
              >
                <div>
                  <strong>{{ inventoryProducts() }}</strong
                  ><span>{{ text('productos', 'products') }}</span>
                </div>
              </div>
              <div class="health-legend">
                <div>
                  <i class="healthy"></i><span>{{ text('Saludables', 'Healthy') }}</span
                  ><strong>{{ store.inventoryHealth().healthyProducts }}</strong>
                </div>
                <div>
                  <i class="warning"></i><span>{{ text('Stock bajo', 'Low stock') }}</span
                  ><strong>{{ store.inventoryHealth().lowStockProducts }}</strong>
                </div>
                <div>
                  <i class="danger"></i><span>{{ text('Agotados', 'Out of stock') }}</span
                  ><strong>{{ store.inventoryHealth().outOfStockProducts }}</strong>
                </div>
              </div>
            </div>
            <div class="unit-summary">
              <span
                ><small>{{ text('Disponibles', 'Available') }}</small
                ><strong>{{
                  store.inventoryHealth().availableUnits | number: '1.0-2'
                }}</strong></span
              >
              <span
                ><small>{{ text('Reservadas', 'Reserved') }}</small
                ><strong>{{
                  store.inventoryHealth().reservedUnits | number: '1.0-2'
                }}</strong></span
              >
            </div>
          </article>

          <article class="surface panel aging-panel">
            <header class="panel__header">
              <div>
                <span>{{ text('Cobranza', 'Collections') }}</span>
                <h2>{{ text('Antigüedad de cartera', 'Receivables aging') }}</h2>
                <p>
                  {{
                    text('Concentración del saldo pendiente', 'Outstanding balance concentration')
                  }}
                </p>
              </div>
              <strong>{{ agingTotal() | currency: 'MXN' : 'symbol' : '1.0-0' }}</strong>
            </header>
            <div
              class="aging-bar"
              role="img"
              [attr.aria-label]="
                text('Distribución de cartera por antigüedad', 'Receivables distribution by age')
              "
            >
              @for (segment of agingSegments(); track segment.label) {
                @if (segment.percent > 0) {
                  <i [style.width.%]="segment.percent" [style.background]="segment.color"></i>
                }
              }
            </div>
            <div class="aging-list">
              @for (segment of agingSegments(); track segment.label) {
                <div>
                  <i [style.background]="segment.color"></i>
                  <span
                    ><strong>{{ segment.label }}</strong
                    ><small>{{ segment.value | currency: 'MXN' : 'symbol' : '1.0-0' }}</small></span
                  >
                  <b>{{ segment.percent | number: '1.0-0' }}%</b>
                </div>
              }
            </div>
          </article>
        </section>
      }
    </div>
  `,
  styleUrl: './dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  protected readonly store = inject(DashboardStore);
  protected readonly i18n = inject(LanguageService);
  private readonly today = localDate(new Date());

  protected readonly weeklySales = computed(() =>
    this.store.salesTrend().reduce((total, day) => total + day.sales, 0),
  );
  protected readonly inventoryProducts = computed(() => {
    const health = this.store.inventoryHealth();
    return health.healthyProducts + health.lowStockProducts + health.outOfStockProducts;
  });
  protected readonly agingTotal = computed(() => {
    const aging = this.store.receivablesAging();
    return aging.current + aging.days1To30 + aging.days31To60 + aging.days61To90 + aging.over90;
  });
  protected readonly agingSegments = computed<readonly AgingSegment[]>(() => {
    const aging = this.store.receivablesAging();
    const total = this.agingTotal();
    const values = [
      [this.text('Al corriente', 'Current'), aging.current, '#35d2b1'],
      [this.text('1–30 días', '1–30 days'), aging.days1To30, '#73a5ff'],
      [this.text('31–60 días', '31–60 days'), aging.days31To60, '#6c7cff'],
      [this.text('61–90 días', '61–90 days'), aging.days61To90, '#ffb84d'],
      [this.text('+90 días', '+90 days'), aging.over90, '#ff6b8a'],
    ] as const;
    return values.map(([label, value, color]) => ({
      label,
      value,
      color,
      percent: total > 0 ? (value / total) * 100 : 0,
    }));
  });

  ngOnInit(): void {
    this.store.load();
  }

  protected text(spanish: string, english: string): string {
    return this.i18n.language() === 'en' ? english : spanish;
  }

  protected executiveTitle(): string {
    const sales = this.store.metrics().find((metric) => metric.key === 'todaySales')?.value ?? 0;
    return sales > 0
      ? this.text('El negocio ya está en movimiento', 'Business is already moving')
      : this.text('Todo listo para comenzar el día', 'Everything is ready to start the day');
  }

  protected executiveMessage(): string {
    const transactions =
      this.store.metrics().find((metric) => metric.key === 'todayTransactions')?.value ?? 0;
    const lowStock =
      this.store.metrics().find((metric) => metric.key === 'lowStockProducts')?.value ?? 0;
    return this.text(
      `${transactions} operaciones registradas hoy · ${lowStock} productos requieren atención`,
      `${transactions} transactions recorded today · ${lowStock} products need attention`,
    );
  }

  protected salesHeight(value: number): number {
    const maximum = Math.max(...this.store.salesTrend().map((day) => day.sales), 0);
    return value > 0 && maximum > 0 ? Math.max(8, (value / maximum) * 100) : 3;
  }

  protected inventoryDonut(): string {
    const health = this.store.inventoryHealth();
    const total = this.inventoryProducts();
    if (total <= 0) return 'conic-gradient(#e5ebf3 0 100%)';
    const healthy = (health.healthyProducts / total) * 100;
    const low = (health.lowStockProducts / total) * 100;
    return `conic-gradient(#35d2b1 0 ${healthy}%, #ffb84d ${healthy}% ${healthy + low}%, #ff6b8a ${healthy + low}% 100%)`;
  }

  protected inventoryHealthLabel(): string {
    const health = this.store.inventoryHealth();
    return this.text(
      `${health.healthyProducts} saludables, ${health.lowStockProducts} con stock bajo y ${health.outOfStockProducts} agotados`,
      `${health.healthyProducts} healthy, ${health.lowStockProducts} low stock and ${health.outOfStockProducts} out of stock`,
    );
  }

  protected destinationFor(key: string): string {
    if (key === 'todaySales' || key === 'todayTransactions') return '/operations/counter-sales';
    if (key === 'inventoryUnits' || key === 'lowStockProducts') return '/operations/inventory';
    if (key === 'receivables') return '/operations/receivables';
    return '/operations/reports';
  }

  protected queryParamsFor(key: string): Params | null {
    if (key === 'todaySales' || key === 'todayTransactions') {
      return { view: 'history', from: this.today, to: this.today };
    }
    if (key === 'inventoryUnits') return { operation: 'INV-01' };
    if (key === 'lowStockProducts') return { operation: 'INV-03' };
    if (key === 'receivables') return { operation: 'ACR-01' };
    return null;
  }

  protected actionLabelFor(key: string): string {
    const labels: Record<string, TranslationKey> = {
      todaySales: 'dashboard.action.sales',
      todayTransactions: 'dashboard.action.transactions',
      inventoryUnits: 'dashboard.action.inventory',
      lowStockProducts: 'dashboard.action.lowStock',
      receivables: 'dashboard.action.receivables',
    };
    return this.i18n.translate(labels[key] ?? 'dashboard.action.openReport');
  }
}

function localDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
