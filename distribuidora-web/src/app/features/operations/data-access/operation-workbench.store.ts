import { inject, Injectable, signal } from '@angular/core';
import { finalize, forkJoin, map } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { EndpointDefinition } from '../../../core/api/endpoint-catalog.generated';
import { ApiError } from '../../../core/error-handling/api-error.model';
import {
  BusinessField,
  BusinessLineField,
  BusinessLookup,
  BusinessOption,
} from '../business-workspace/business-workspace.models';

@Injectable()
export class OperationWorkbenchStore {
  private readonly api = inject(ApiClientService);
  private readonly loadingState = signal(false);
  private readonly resultState = signal<unknown>(null);
  private readonly errorState = signal<ApiError | null>(null);
  private readonly lookupLoadingState = signal(false);
  private readonly optionsState = signal<Readonly<Record<string, readonly BusinessOption[]>>>({});
  private readonly balancesState = signal<
    readonly {
      warehouseId: string;
      productId: string;
      quantity: number;
      reservedQuantity: number;
    }[]
  >([]);

  readonly loading = this.loadingState.asReadonly();
  readonly result = this.resultState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly lookupLoading = this.lookupLoadingState.asReadonly();

  clearResult(): void {
    this.resultState.set(null);
    this.errorState.set(null);
  }

  loadBalances(): void {
    this.api.get<unknown>('/api/v1/inventory/balances').subscribe({
      next: (response) => {
        const collection = Array.isArray(response) ? response : [];
        this.balancesState.set(
          collection
            .filter(
              (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object',
            )
            .map((item) => ({
              warehouseId: String(item['warehouseId'] ?? ''),
              productId: String(item['productId'] ?? ''),
              quantity: finiteNumber(item['quantity']),
              reservedQuantity: finiteNumber(item['reservedQuantity']),
            })),
        );
      },
      error: (error: ApiError) => this.errorState.set(error),
    });
  }

  availableStock(productId: string, warehouseId: string): number | null {
    if (!productId || !warehouseId) return null;
    const balance = this.balancesState().find(
      (item) => item.productId === productId && item.warehouseId === warehouseId,
    );
    return Math.max(0, (balance?.quantity ?? 0) - (balance?.reservedQuantity ?? 0));
  }

  loadOptions(fields: readonly BusinessField[]): void {
    const lookups = fields
      .flatMap((field) => [field, ...(field.itemFields ?? [])])
      .filter(
        (
          field,
        ): field is (BusinessField | BusinessLineField) &
          Required<Pick<BusinessLookup, 'optionsEndpoint'>> => Boolean(field.optionsEndpoint),
      );
    const unique = [
      ...new Map(lookups.map((field) => [lookupKey(field), field] as const)).values(),
    ];
    if (unique.length === 0) {
      this.optionsState.set({});
      return;
    }

    this.lookupLoadingState.set(true);
    forkJoin(
      unique.map((field) =>
        this.api
          .get<unknown>(field.optionsEndpoint)
          .pipe(map((response) => [lookupKey(field), toOptions(response, field)] as const)),
      ),
    )
      .pipe(finalize(() => this.lookupLoadingState.set(false)))
      .subscribe({
        next: (entries) => this.optionsState.set(Object.fromEntries(entries)),
        error: (error: ApiError) => this.errorState.set(error),
      });
  }

  optionsFor(field: BusinessLookup): readonly BusinessOption[] {
    return this.optionsState()[lookupKey(field)] ?? [];
  }

  execute(
    operation: EndpointDefinition,
    parameters: Readonly<Record<string, string>>,
    query: Readonly<Record<string, string>>,
    body: Record<string, unknown>,
    completed?: (result: unknown) => void,
  ): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.resultState.set(null);
    const path = interpolate(operation.path, parameters);
    const request =
      operation.method === 'GET'
        ? this.api.get<unknown>(path, { query })
        : operation.method === 'POST'
          ? this.api.post<unknown, Record<string, unknown>>(path, body)
          : this.api.put<unknown, Record<string, unknown>>(path, body);

    request.pipe(finalize(() => this.loadingState.set(false))).subscribe({
      next: (result) => {
        this.resultState.set(result);
        completed?.(result);
      },
      error: (error: ApiError) => this.errorState.set(error),
    });
  }
}

function lookupKey(field: BusinessLookup): string {
  return [
    field.optionsEndpoint,
    field.optionValueKey ?? 'id',
    field.optionLabelKey ?? 'name',
    field.optionSecondaryKey ?? '',
    field.optionFilterKey ?? '',
    field.optionFilterValue ?? '',
  ].join('|');
}

function toOptions(value: unknown, field: BusinessLookup): readonly BusinessOption[] {
  const collection = Array.isArray(value)
    ? value
    : value &&
        typeof value === 'object' &&
        Array.isArray((value as Record<string, unknown>)['items'])
      ? ((value as Record<string, unknown>)['items'] as readonly unknown[])
      : [];

  return collection
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) &&
        typeof item === 'object' &&
        (item as Record<string, unknown>)['active'] !== false &&
        (!field.optionFilterKey ||
          (item as Record<string, unknown>)[field.optionFilterKey] === field.optionFilterValue),
    )
    .map((item) => {
      const rawValue = item[field.optionValueKey ?? 'id'] ?? '';
      const primaryKey = field.optionLabelKey ?? 'name';
      const primary = optionPart(primaryKey, item[primaryKey]);
      const secondary = field.optionSecondaryKey
        ? optionPart(field.optionSecondaryKey, item[field.optionSecondaryKey])
        : '';
      return {
        value: typeof rawValue === 'number' ? rawValue : String(rawValue),
        label: secondary && secondary !== primary ? `${secondary} · ${primary}` : primary,
      };
    })
    .filter((option) => option.value !== '' && option.label !== '');
}

function optionPart(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (/date|at$/i.test(key) && typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }
  return String(value);
}

function finiteNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function interpolate(path: string, parameters: Readonly<Record<string, string>>): string {
  return path.replace(/\{([^}]+)\}/g, (_match, key: string) => {
    const value = parameters[key];
    if (!value) throw new Error(`Falta el parámetro ${key}.`);
    return encodeURIComponent(value);
  });
}
