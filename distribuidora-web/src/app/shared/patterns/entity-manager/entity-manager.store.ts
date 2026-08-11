import { inject, Injectable, signal } from '@angular/core';
import { finalize, forkJoin, map } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { ApiError } from '../../../core/error-handling/api-error.model';
import {
  EntityFieldDefinition,
  EntityOption,
  EntityRecord,
  EntityResourceDefinition,
} from './entity-manager.models';

@Injectable()
export class EntityManagerStore {
  private readonly api = inject(ApiClientService);
  private readonly rowsState = signal<readonly EntityRecord[]>([]);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<ApiError | null>(null);
  private readonly optionsState = signal<Readonly<Record<string, readonly EntityOption[]>>>({});
  private readonly pageState = signal(1);
  private readonly pageSizeState = signal(25);
  private readonly totalState = signal(0);
  private definition?: EntityResourceDefinition;

  readonly rows = this.rowsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly options = this.optionsState.asReadonly();
  readonly page = this.pageState.asReadonly();
  readonly pageSize = this.pageSizeState.asReadonly();
  readonly total = this.totalState.asReadonly();

  configure(definition: EntityResourceDefinition): void {
    this.definition = definition;
    this.pageState.set(1);
    this.pageSizeState.set(definition.pageSize ?? 25);
    this.totalState.set(0);
    this.loadOptions();
  }

  load(page = this.pageState(), pageSize = this.pageSizeState()): void {
    if (!this.definition) return;
    this.loadingState.set(true);
    this.errorState.set(null);
    this.api
      .get<unknown>(
        this.definition.listEndpoint,
        this.definition.paged ? { query: { Page: page, PageSize: pageSize } } : undefined,
      )
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (response) => {
          const result = toCollectionResult(response);
          this.rowsState.set(result.items);
          this.pageState.set(result.page ?? page);
          this.pageSizeState.set(result.pageSize ?? pageSize);
          this.totalState.set(result.total ?? result.items.length);
        },
        error: (error: ApiError) => this.errorState.set(error),
      });
  }

  save(id: string | undefined, request: Record<string, unknown>, completed: () => void): void {
    if (!this.definition) return;
    this.savingState.set(true);
    this.errorState.set(null);
    const endpoint = id
      ? this.definition.updateEndpoint.replace('{id}', encodeURIComponent(id))
      : this.definition.createEndpoint;
    const operation = id
      ? this.api.put<unknown, Record<string, unknown>>(endpoint, request)
      : this.api.post<unknown, Record<string, unknown>>(endpoint, request);
    operation.pipe(finalize(() => this.savingState.set(false))).subscribe({
      next: () => {
        completed();
        this.load();
      },
      error: (error: ApiError) => this.errorState.set(error),
    });
  }

  loadOne(id: string, completed: (row: EntityRecord) => void): void {
    if (!this.definition?.detailEndpoint) return;
    this.loadingState.set(true);
    this.errorState.set(null);
    this.api
      .get<unknown>(this.definition.detailEndpoint.replace('{id}', encodeURIComponent(id)))
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (response) => {
          if (response && typeof response === 'object') completed(response as EntityRecord);
        },
        error: (error: ApiError) => this.errorState.set(error),
      });
  }

  optionsFor(field: EntityFieldDefinition): readonly EntityOption[] {
    return field.options ?? this.optionsState()[field.key] ?? [];
  }

  private loadOptions(): void {
    const remoteFields = this.definition?.fields.filter((field) => field.optionsEndpoint) ?? [];
    if (remoteFields.length === 0) return;
    forkJoin(
      remoteFields.map((field) =>
        this.api
          .get<unknown>(field.optionsEndpoint!)
          .pipe(map((response) => [field.key, toOptions(response, field)] as const)),
      ),
    ).subscribe({
      next: (entries) => this.optionsState.set(Object.fromEntries(entries)),
      error: (error: ApiError) => this.errorState.set(error),
    });
  }
}

interface CollectionResult {
  items: readonly EntityRecord[];
  page?: number;
  pageSize?: number;
  total?: number;
}

function toCollectionResult(value: unknown): CollectionResult {
  if (Array.isArray(value)) return { items: toEntityRecords(value), total: value.length };
  if (!value || typeof value !== 'object') return { items: [], total: 0 };

  const paged = value as Record<string, unknown>;
  return {
    items: Array.isArray(paged['items']) ? toEntityRecords(paged['items']) : [],
    page: finiteNumber(paged['page']),
    pageSize: finiteNumber(paged['pageSize']),
    total: finiteNumber(paged['total']),
  };
}

function toEntityRecords(value: readonly unknown[]): readonly EntityRecord[] {
  return value.filter((item): item is EntityRecord => typeof item === 'object' && item !== null);
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toOptions(value: unknown, field: EntityFieldDefinition): readonly EntityOption[] {
  const collection = Array.isArray(value)
    ? value
    : value &&
        typeof value === 'object' &&
        Array.isArray((value as Record<string, unknown>)['items'])
      ? ((value as Record<string, unknown>)['items'] as readonly unknown[])
      : [];

  return collection
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => {
      const primary = String(item[field.optionLabelKey ?? 'name'] ?? '');
      const secondary = field.optionSecondaryKey
        ? String(item[field.optionSecondaryKey] ?? '')
        : '';
      const rawValue = item['id'] ?? item['value'] ?? '';
      return {
        value: typeof rawValue === 'number' ? rawValue : String(rawValue),
        label: secondary ? `${secondary} · ${primary}` : primary,
      };
    });
}
