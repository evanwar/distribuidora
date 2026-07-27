import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { ApiClientService } from '../../../../core/api/api-client.service';
import {
  CounterSale,
  CreateCounterSale,
  PosCustomer,
  PosPaymentMethod,
  PosProduct,
  PosStockBalance,
  PosWarehouse,
} from '../models/counter-sale.models';

@Injectable()
export class CounterSalesApiAdapter {
  private readonly api = inject(ApiClientService);

  loadWorkspace(): Observable<{
    customers: readonly PosCustomer[];
    products: readonly PosProduct[];
    warehouses: readonly PosWarehouse[];
    paymentMethods: readonly PosPaymentMethod[];
    balances: readonly PosStockBalance[];
    sales: readonly CounterSale[];
  }> {
    return forkJoin({
      customers: this.api.get<unknown>('/api/v1/customers?limit=20'),
      products: this.api.get<unknown>('/api/v1/products?Page=1&PageSize=100'),
      warehouses: this.api.get<unknown>('/api/v1/warehouses'),
      balances: this.api.get<unknown>('/api/v1/inventory/balances'),
      paymentMethods: this.api.get<unknown>('/api/v1/admin/payment-methods'),
      sales: this.api.get<unknown>('/api/v1/counter-sales'),
    }).pipe(
      map(({ customers, products, warehouses, balances, paymentMethods, sales }) => ({
        customers: asRecords(customers).map(toCustomer),
        products: asRecords(products)
          .filter((item) => item['active'] !== false)
          .map((item) => ({
            id: text(item, 'id'),
            sku: text(item, 'sku'),
            name: text(item, 'name', 'Producto sin nombre'),
            barcode: text(item, 'barcode'),
            price: number(item, 'basePrice'),
          })),
        warehouses: asRecords(warehouses)
          .filter((item) => item['active'] !== false)
          .map((item) => ({ id: text(item, 'id'), name: text(item, 'name') })),
        balances: asRecords(balances).map((item) => ({
          warehouseId: text(item, 'warehouseId'),
          productId: text(item, 'productId'),
          quantity: number(item, 'quantity'),
          reservedQuantity: number(item, 'reservedQuantity'),
        })),
        paymentMethods: asRecords(paymentMethods)
          .filter((item) => item['active'] !== false)
          .map((item) => ({
            code: text(item, 'code'),
            name: text(item, 'name'),
            requiresReference: bool(item, 'requiresReference'),
          })),
        sales: asRecords(sales).map(toSale),
      })),
    );
  }

  searchCustomers(query: string): Observable<readonly PosCustomer[]> {
    const parameters = new URLSearchParams({ limit: '20' });
    const normalizedQuery = query.trim();
    if (normalizedQuery) parameters.set('search', normalizedQuery);

    return this.api
      .get<unknown>(`/api/v1/customers?${parameters.toString()}`)
      .pipe(map((response) => asRecords(response).map(toCustomer)));
  }

  create(request: CreateCounterSale): Observable<CounterSale> {
    return this.api
      .post<unknown, CreateCounterSale>('/api/v1/counter-sales', request)
      .pipe(map(toSale));
  }

  update(id: string, request: CreateCounterSale): Observable<CounterSale> {
    return this.api
      .put<unknown, CreateCounterSale>(`/api/v1/counter-sales/${encodeURIComponent(id)}`, request)
      .pipe(map(toSale));
  }

  confirm(id: string): Observable<CounterSale> {
    return this.api
      .post<unknown>(`/api/v1/counter-sales/${encodeURIComponent(id)}/confirm`)
      .pipe(map(toSale));
  }

  addPayment(id: string, request: { method: string; amount: number; reference: string | null }) {
    return this.api.post<void, typeof request>(
      `/api/v1/counter-sales/${encodeURIComponent(id)}/payments`,
      request,
    );
  }

  cancel(id: string, reason: string) {
    return this.api.post<void, { reason: string }>(
      `/api/v1/counter-sales/${encodeURIComponent(id)}/cancel`,
      { reason },
    );
  }

  getPrintable(id: string): Observable<CounterSale> {
    return this.api
      .get<unknown>(`/api/v1/counter-sales/${encodeURIComponent(id)}/print`)
      .pipe(map(toSale));
  }
}

function asRecords(value: unknown): Record<string, unknown>[] {
  let collection: readonly unknown[] = [];
  if (Array.isArray(value)) {
    collection = value;
  } else if (value && typeof value === 'object') {
    const items = (value as Record<string, unknown>)['items'];
    if (Array.isArray(items)) collection = items;
  }
  return collection.filter(
    (item): item is Record<string, unknown> => !!item && typeof item === 'object',
  );
}

function toSale(value: unknown): CounterSale {
  const item = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    id: text(item, 'id'),
    folio: text(item, 'folio', 'Sin folio'),
    saleDate: text(item, 'saleDate'),
    customerId: text(item, 'customerId') || null,
    sourceWarehouseId: text(item, 'sourceWarehouseId'),
    status: text(item, 'status', 'Draft'),
    paymentCondition: text(item, 'paymentCondition', 'Cash'),
    subtotal: number(item, 'subtotal'),
    discountTotal: number(item, 'discountTotal'),
    taxTotal: number(item, 'taxTotal'),
    total: number(item, 'total'),
    paidAmount: number(item, 'paidAmount'),
    balance: number(item, 'balance'),
    notes: text(item, 'notes') || null,
    items: asRecords(item['items']).map((line) => ({
      productId: text(line, 'productId'),
      quantity: number(line, 'quantity'),
      unitPrice: number(line, 'unitPrice'),
      discount: number(line, 'discount'),
    })),
  };
}

function toCustomer(item: Record<string, unknown>): PosCustomer {
  return {
    id: text(item, 'id'),
    name: text(item, 'name', 'Cliente sin nombre'),
    phone: text(item, 'phone'),
    creditBlocked: bool(item, 'creditBlocked'),
  };
}

function text(item: Record<string, unknown>, key: string, fallback = ''): string {
  const value = item[key];
  return typeof value === 'string' ? value : fallback;
}

function number(item: Record<string, unknown>, key: string): number {
  const value = item[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function bool(item: Record<string, unknown>, key: string): boolean {
  return item[key] === true;
}
