import { HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClientService } from '../../../../core/api/api-client.service';

export interface PaymentTerminalViewModel {
  readonly id: string;
  readonly name: string;
  readonly provider: string;
  readonly externalId: string;
  readonly description: string | null;
  readonly isDefault: boolean;
  readonly active: boolean;
  readonly rowVersion: number;
}

export interface SavePaymentTerminal {
  readonly name: string;
  readonly externalId: string;
  readonly description: string | null;
  readonly isDefault: boolean;
  readonly active: boolean;
  readonly rowVersion?: number;
}

@Injectable()
export class PaymentTerminalsApiAdapter {
  private readonly api = inject(ApiClientService);

  getAll(context?: HttpContext): Observable<readonly PaymentTerminalViewModel[]> {
    return this.api
      .get<unknown>('/api/v1/admin/payment-terminals', { context })
      .pipe(map((value) => records(value).map(toPaymentTerminal)));
  }

  create(
    request: SavePaymentTerminal,
    context?: HttpContext,
  ): Observable<PaymentTerminalViewModel> {
    return this.api
      .post<unknown, SavePaymentTerminal>('/api/v1/admin/payment-terminals', request, { context })
      .pipe(map(toPaymentTerminal));
  }

  update(
    id: string,
    request: SavePaymentTerminal,
    context?: HttpContext,
  ): Observable<PaymentTerminalViewModel> {
    return this.api
      .put<unknown, SavePaymentTerminal>(
        `/api/v1/admin/payment-terminals/${encodeURIComponent(id)}`,
        request,
        { context },
      )
      .pipe(map(toPaymentTerminal));
  }

  setActive(
    id: string,
    active: boolean,
    context?: HttpContext,
  ): Observable<PaymentTerminalViewModel> {
    const action = active ? 'activate' : 'deactivate';
    return this.api
      .post<unknown>(
        `/api/v1/admin/payment-terminals/${encodeURIComponent(id)}/${action}`,
        undefined,
        { context },
      )
      .pipe(map(toPaymentTerminal));
  }
}

function toPaymentTerminal(value: unknown): PaymentTerminalViewModel {
  const item = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    id: stringValue(item, 'id'),
    name: stringValue(item, 'name'),
    provider: stringValue(item, 'provider'),
    externalId: stringValue(item, 'externalId'),
    description: stringValue(item, 'description') || null,
    isDefault: item['isDefault'] === true,
    active: item['active'] === true,
    rowVersion: numberValue(item, 'rowVersion'),
  };
}

function records(value: unknown): readonly Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (isRecord(value) && Array.isArray(value['items'])) return value['items'].filter(isRecord);
  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(item: Record<string, unknown>, key: string): string {
  return typeof item[key] === 'string' ? item[key] : '';
}

function numberValue(item: Record<string, unknown>, key: string): number {
  return typeof item[key] === 'number' && Number.isFinite(item[key]) ? item[key] : 0;
}
