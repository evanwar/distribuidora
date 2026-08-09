import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink, type Params } from '@angular/router';
import { UiAlertComponent } from '../../../shared/ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';
import { UiFeedbackComponent } from '../../../shared/ui/feedback/ui-feedback.component';
import { UiIconComponent } from '../../../shared/ui/icon/ui-icon.component';
import { UiPageHeaderComponent } from '../../../shared/ui/page-header/ui-page-header.component';
import { DashboardStore } from '../data-access/dashboard.store';
import { LanguageService } from '../../../core/i18n/language.service';
import { TranslationKey } from '../../../core/i18n/translation.catalog';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CurrencyPipe,
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
    <div class="page">
      <app-ui-page-header
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
        <section class="metrics" [attr.aria-label]="i18n.translate('dashboard.indicators')">
          @for (metric of store.metrics(); track metric.key) {
            <a
              class="surface metric"
              [routerLink]="destinationFor(metric.key)"
              [queryParams]="queryParamsFor(metric.key)"
              [attr.aria-label]="actionLabelFor(metric.key) + ': ' + metric.value"
            >
              <span class="metric__icon"><app-ui-icon [name]="metric.icon" /></span>
              <div class="metric__content">
                <span>{{ i18n.translate(metric.label) }}</span>
                <strong>
                  @if (metric.format === 'currency' && isNumber(metric.value)) {
                    {{ metric.value | currency: 'MXN' : 'symbol' : '1.2-2' }}
                  } @else if (metric.format === 'number' && isNumber(metric.value)) {
                    {{ metric.value | number: '1.0-2' }}
                  } @else {
                    {{ metric.value }}
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
      }
    </div>
  `,
  styles: `
    .metrics {
      display: grid;
      gap: var(--space-4);
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
    }
    .metric {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: var(--space-4);
      min-height: 7.5rem;
      padding: var(--space-5);
      color: inherit;
      text-decoration: none;
      transition:
        border-color 140ms ease,
        box-shadow 140ms ease,
        transform 140ms ease;
    }
    .metric:hover {
      border-color: color-mix(in srgb, var(--app-primary) 35%, var(--app-border));
      box-shadow: var(--app-shadow-navigation);
      transform: translateY(-2px);
    }
    .metric:focus-visible {
      outline: 3px solid color-mix(in srgb, var(--app-primary) 38%, transparent);
      outline-offset: 3px;
    }
    .metric__icon {
      display: grid;
      width: 3rem;
      height: 3rem;
      place-items: center;
      border-radius: var(--app-radius-sm);
      background: var(--app-surface-muted);
      color: var(--app-primary);
    }
    .metric__icon app-ui-icon {
      width: 1.5rem;
      height: 1.5rem;
    }
    .metric__content {
      display: grid;
      gap: var(--space-2);
      min-width: 0;
    }
    .metric__content > span:first-child {
      color: var(--app-text-muted);
    }
    .metric strong {
      font-size: clamp(1.55rem, 5vw, 2.2rem);
      font-variant-numeric: tabular-nums;
    }
    .metric__action {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      color: var(--app-primary-strong);
      font-size: 0.82rem;
      font-weight: 700;
    }
    .metric__action app-ui-icon {
      width: 1rem;
      height: 1rem;
    }
    @media (prefers-reduced-motion: reduce) {
      .metric {
        transition: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  protected readonly store = inject(DashboardStore);
  protected readonly i18n = inject(LanguageService);
  private readonly today = localDate(new Date());

  ngOnInit(): void {
    this.store.load();
  }

  protected isNumber(value: string | number): value is number {
    return typeof value === 'number';
  }

  protected destinationFor(key: string): string {
    if (key === 'todaySales' || key === 'todayTransactions') {
      return '/operations/counter-sales';
    }
    if (key === 'inventoryUnits' || key === 'lowStockProducts') {
      return '/operations/inventory';
    }
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
