import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { ApiError } from '../../../core/error-handling/api-error.model';
import { TranslationKey } from '../../../core/i18n/translation.catalog';
import { UiIconName } from '../../../shared/ui/icon/ui-icon.component';

export interface DashboardMetric {
  readonly key: string;
  readonly label: TranslationKey;
  readonly value: number;
  readonly format: 'currency' | 'number';
  readonly icon: UiIconName;
}

export interface DashboardSalesDay {
  readonly date: string;
  readonly sales: number;
  readonly transactions: number;
}

export interface DashboardInventoryHealth {
  readonly healthyProducts: number;
  readonly lowStockProducts: number;
  readonly outOfStockProducts: number;
  readonly availableUnits: number;
  readonly reservedUnits: number;
}

export interface DashboardAging {
  readonly current: number;
  readonly days1To30: number;
  readonly days31To60: number;
  readonly days61To90: number;
  readonly over90: number;
}

export interface DashboardView {
  readonly metrics: readonly DashboardMetric[];
  readonly salesTrend: readonly DashboardSalesDay[];
  readonly inventoryHealth: DashboardInventoryHealth;
  readonly receivablesAging: DashboardAging;
}

const METRIC_PRESENTATION: Readonly<
  Record<string, Pick<DashboardMetric, 'label' | 'format' | 'icon'>>
> = {
  todaySales: { label: 'dashboard.metric.sales', format: 'currency', icon: 'point-of-sale' },
  todayTransactions: {
    label: 'dashboard.metric.transactions',
    format: 'number',
    icon: 'history',
  },
  inventoryUnits: { label: 'dashboard.metric.inventory', format: 'number', icon: 'inventory' },
  lowStockProducts: {
    label: 'dashboard.metric.lowStock',
    format: 'number',
    icon: 'low-stock',
  },
  receivables: {
    label: 'dashboard.metric.receivables',
    format: 'currency',
    icon: 'receivables',
  },
};

const EMPTY_VIEW: DashboardView = {
  metrics: [],
  salesTrend: [],
  inventoryHealth: {
    healthyProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    availableUnits: 0,
    reservedUnits: 0,
  },
  receivablesAging: { current: 0, days1To30: 0, days31To60: 0, days61To90: 0, over90: 0 },
};

@Injectable()
export class DashboardStore {
  private readonly api = inject(ApiClientService);
  private readonly viewState = signal<DashboardView>(EMPTY_VIEW);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<ApiError | null>(null);

  readonly view = this.viewState.asReadonly();
  readonly metrics = () => this.viewState().metrics;
  readonly salesTrend = () => this.viewState().salesTrend;
  readonly inventoryHealth = () => this.viewState().inventoryHealth;
  readonly receivablesAging = () => this.viewState().receivablesAging;
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  load(): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.api
      .get<Record<string, unknown>>('/api/v1/dashboard/summary')
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (summary) => this.viewState.set(toDashboardView(summary)),
        error: (error: ApiError) => this.errorState.set(error),
      });
  }
}

export function toDashboardView(summary: Record<string, unknown> | null): DashboardView {
  const source = summary ?? {};
  const metrics = Object.entries(METRIC_PRESENTATION).map(([key, presentation]) => ({
    key,
    ...presentation,
    value: finiteNumber(source[key]),
  }));
  const inventory = record(source['inventoryHealth']);
  const aging = record(source['receivablesAging']);
  const salesTrend = Array.isArray(source['salesTrend'])
    ? source['salesTrend']
        .map(record)
        .filter((item): item is Record<string, unknown> => item !== null)
        .map((item) => ({
          date: String(item['date'] ?? ''),
          sales: finiteNumber(item['sales']),
          transactions: finiteNumber(item['transactions']),
        }))
    : [];

  return {
    metrics,
    salesTrend,
    inventoryHealth: {
      healthyProducts: finiteNumber(inventory?.['healthyProducts']),
      lowStockProducts: finiteNumber(inventory?.['lowStockProducts']),
      outOfStockProducts: finiteNumber(inventory?.['outOfStockProducts']),
      availableUnits: finiteNumber(inventory?.['availableUnits']),
      reservedUnits: finiteNumber(inventory?.['reservedUnits']),
    },
    receivablesAging: {
      current: finiteNumber(aging?.['current']),
      days1To30: finiteNumber(aging?.['days1To30']),
      days31To60: finiteNumber(aging?.['days31To60']),
      days61To90: finiteNumber(aging?.['days61To90']),
      over90: finiteNumber(aging?.['over90']),
    },
  };
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function finiteNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
