import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { UiAlertComponent } from '../../../shared/ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';
import { UiFeedbackComponent } from '../../../shared/ui/feedback/ui-feedback.component';
import { UiIconComponent } from '../../../shared/ui/icon/ui-icon.component';
import { UiPageHeaderComponent } from '../../../shared/ui/page-header/ui-page-header.component';
import { DashboardStore } from '../data-access/dashboard.store';

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
  ],
  providers: [DashboardStore],
  template: `
    <div class="page">
      <app-ui-page-header
        eyebrow="Resumen de hoy"
        title="Centro de operación"
        subtitle="Una lectura rápida de ventas, inventario y cobranza."
      >
        <app-ui-button label="Actualizar" variant="outlined" icon="refresh" (pressed)="store.load()" />
      </app-ui-page-header>

      @if (store.loading()) {
        <section class="surface">
          <app-ui-feedback
            kind="loading"
            title="Actualizando indicadores"
            message="Consultando el estado más reciente."
          />
        </section>
      } @else if (store.error()) {
        <app-ui-alert
          title="No pudimos cargar el resumen"
          [message]="store.error()!.message"
          tone="danger"
          [correlationId]="store.error()!.correlationId"
          actionLabel="Reintentar"
          (action)="store.load()"
        />
      } @else if (store.metrics().length === 0) {
        <section class="surface">
          <app-ui-feedback
            kind="empty"
            title="Sin indicadores por ahora"
            message="Todavía no hay información disponible para este momento."
          />
        </section>
      } @else {
        <section class="metrics" aria-label="Indicadores">
          @for (metric of store.metrics(); track metric.key) {
            <article class="surface metric">
              <span class="metric__icon"><app-ui-icon [name]="metric.icon" /></span>
              <div>
                <span>{{ metric.label }}</span>
                <strong>
                  @if (metric.format === 'currency' && isNumber(metric.value)) {
                    {{ metric.value | currency: 'MXN' : 'symbol' : '1.2-2' }}
                  } @else if (metric.format === 'number' && isNumber(metric.value)) {
                    {{ metric.value | number: '1.0-2' }}
                  } @else {
                    {{ metric.value }}
                  }
                </strong>
              </div>
            </article>
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
    .metric__icon app-ui-icon { width: 1.5rem; height: 1.5rem; }
    .metric div { display: grid; gap: var(--space-2); min-width: 0; }
    .metric div span { color: var(--app-text-muted); }
    .metric strong { font-size: clamp(1.55rem, 5vw, 2.2rem); font-variant-numeric: tabular-nums; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  protected readonly store = inject(DashboardStore);
  ngOnInit(): void {
    this.store.load();
  }

  protected isNumber(value: string | number): value is number {
    return typeof value === 'number';
  }
}
