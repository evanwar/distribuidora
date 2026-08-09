import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { ApiError } from '../../../core/error-handling/api-error.model';
import { UiIconName } from '../../../shared/ui/icon/ui-icon.component';
import { TranslationKey } from '../../../core/i18n/translation.catalog';

export interface DashboardMetric {
  key: string;
  label: TranslationKey;
  value: string | number;
  format: 'currency' | 'number' | 'text';
  icon: UiIconName;
}

const METRIC_PRESENTATION: Record<
  string,
  Pick<DashboardMetric, 'label' | 'format' | 'icon'>
> = {
  todaySales: { label: 'dashboard.metric.sales', format: 'currency', icon: 'point-of-sale' },
  todayTransactions: { label: 'dashboard.metric.transactions', format: 'number', icon: 'history' },
  inventoryUnits: { label: 'dashboard.metric.inventory', format: 'number', icon: 'inventory' },
  lowStockProducts: { label: 'dashboard.metric.lowStock', format: 'number', icon: 'low-stock' },
  receivables: { label: 'dashboard.metric.receivables', format: 'currency', icon: 'receivables' },
};

@Injectable()
export class DashboardStore {
  private readonly api = inject(ApiClientService);
  private readonly metricsState = signal<readonly DashboardMetric[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<ApiError | null>(null);

  readonly metrics = this.metricsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  load(): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.api
      .get<Record<string, unknown>>('/api/v1/dashboard/summary')
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (summary) =>
          this.metricsState.set(
            Object.entries(summary ?? {}).map(([key, value]) => {
              const presentation = METRIC_PRESENTATION[key] ?? {
                label: 'dashboard.metric.other' as const,
                format: typeof value === 'number' ? ('number' as const) : ('text' as const),
                icon: 'reports' as const,
              };
              return {
                key,
                ...presentation,
                value: displayValue(value),
              };
            }),
          ),
        error: (error: ApiError) => this.errorState.set(error),
      });
  }
}

function displayValue(value: unknown): string | number {
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return '—';
}
