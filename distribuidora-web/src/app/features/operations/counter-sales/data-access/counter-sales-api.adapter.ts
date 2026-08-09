import { HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { ApiClientService } from '../../../../core/api/api-client.service';
import {
  CounterSale,
  CreateCounterSale,
  PosCustomer,
  PosPaymentMethod,
  PosPaymentTerminal,
  PointCardPayment,
  ElectronicInvoice,
  IssueElectronicInvoice,
  SaleBillingEligibility,
  SaleBillingRecipient,
  SaleFiscalStatus,
  PosProduct,
  PosStockBalance,
  PosWarehouse,
} from '../models/counter-sale.models';

@Injectable()
export class CounterSalesApiAdapter {
  private readonly api = inject(ApiClientService);

  loadWorkspace(context?: HttpContext): Observable<{
    customers: readonly PosCustomer[];
    products: readonly PosProduct[];
    warehouses: readonly PosWarehouse[];
    paymentMethods: readonly PosPaymentMethod[];
    paymentTerminals: readonly PosPaymentTerminal[];
    balances: readonly PosStockBalance[];
    sales: readonly CounterSale[];
  }> {
    return forkJoin({
      customers: this.api.get<unknown>('/api/v1/customers?limit=20', { context }),
      products: this.api.get<unknown>('/api/v1/products?Page=1&PageSize=100', { context }),
      warehouses: this.api.get<unknown>('/api/v1/warehouses', { context }),
      balances: this.api.get<unknown>('/api/v1/inventory/balances', { context }),
      paymentMethods: this.api.get<unknown>('/api/v1/admin/payment-methods', { context }),
      paymentTerminals: this.api.get<unknown>('/api/v1/admin/payment-terminals/available', { context }),
      sales: this.api.get<unknown>('/api/v1/counter-sales', { context }),
    }).pipe(
      map(({ customers, products, warehouses, balances, paymentMethods, paymentTerminals, sales }) => ({
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
        paymentTerminals: asRecords(paymentTerminals).map((item) => ({
          id: text(item, 'id'),
          name: text(item, 'name'),
          externalId: text(item, 'externalId'),
          isDefault: bool(item, 'isDefault'),
        })),
        sales: asRecords(sales).map(toSale),
      })),
    );
  }

  searchCustomers(query: string, context?: HttpContext): Observable<readonly PosCustomer[]> {
    const parameters = new URLSearchParams({ limit: '20' });
    const normalizedQuery = query.trim();
    if (normalizedQuery) parameters.set('search', normalizedQuery);

    return this.api
      .get<unknown>(`/api/v1/customers?${parameters.toString()}`, { context })
      .pipe(map((response) => asRecords(response).map(toCustomer)));
  }

  create(request: CreateCounterSale, context?: HttpContext): Observable<CounterSale> {
    return this.api
      .post<unknown, CreateCounterSale>('/api/v1/counter-sales', request, { context })
      .pipe(map(toSale));
  }

  update(id: string, request: CreateCounterSale, context?: HttpContext): Observable<CounterSale> {
    return this.api
      .put<unknown, CreateCounterSale>(`/api/v1/counter-sales/${encodeURIComponent(id)}`, request, {
        context,
      })
      .pipe(map(toSale));
  }

  confirm(id: string, context?: HttpContext): Observable<CounterSale> {
    return this.api
      .post<unknown>(`/api/v1/counter-sales/${encodeURIComponent(id)}/confirm`, undefined, {
        context,
      })
      .pipe(map(toSale));
  }

  getById(id: string, context?: HttpContext): Observable<CounterSale> {
    return this.api
      .get<unknown>(`/api/v1/counter-sales/${encodeURIComponent(id)}`, { context })
      .pipe(map(toSale));
  }

  startCardPayment(
    id: string,
    amount: number,
    paymentTerminalId: string,
    context?: HttpContext,
  ): Observable<PointCardPayment> {
    return this.api
      .post<unknown, { amount: number; paymentTerminalId: string }>(
        `/api/v1/counter-sales/${encodeURIComponent(id)}/card-payment`,
        { amount, paymentTerminalId },
        { context },
      )
      .pipe(map(toPointCardPayment));
  }

  getCardPayment(id: string, context?: HttpContext): Observable<PointCardPayment> {
    return this.api
      .get<unknown>(`/api/v1/counter-sales/${encodeURIComponent(id)}/card-payment`, { context })
      .pipe(map(toPointCardPayment));
  }

  cancelCardPayment(id: string, context?: HttpContext): Observable<PointCardPayment> {
    return this.api
      .post<unknown>(
        `/api/v1/counter-sales/${encodeURIComponent(id)}/card-payment/cancel`,
        undefined,
        { context },
      )
      .pipe(map(toPointCardPayment));
  }

  addPayment(
    id: string,
    request: { method: string; amount: number; reference: string | null },
    context?: HttpContext,
  ) {
    return this.api.post<void, typeof request>(
      `/api/v1/counter-sales/${encodeURIComponent(id)}/payments`,
      request,
      { context },
    );
  }

  cancel(id: string, reason: string, context?: HttpContext) {
    return this.api.post<void, { reason: string }>(
      `/api/v1/counter-sales/${encodeURIComponent(id)}/cancel`,
      { reason },
      { context },
    );
  }

  getPrintable(id: string, context?: HttpContext): Observable<CounterSale> {
    return this.api
      .get<unknown>(`/api/v1/counter-sales/${encodeURIComponent(id)}/print`, { context })
      .pipe(map(toSale));
  }

  getElectronicInvoice(id: string, context?: HttpContext): Observable<ElectronicInvoice> {
    return this.api
      .get<unknown>(`/api/v1/sales/${encodeURIComponent(id)}/electronic-invoice`, { context })
      .pipe(map(toElectronicInvoice));
  }

  issueElectronicInvoice(id: string, request: IssueElectronicInvoice, context?: HttpContext): Observable<ElectronicInvoice> {
    return this.api
      .post<unknown, IssueElectronicInvoice>(`/api/v1/sales/${encodeURIComponent(id)}/electronic-invoice`, request, { context })
      .pipe(map(toElectronicInvoice));
  }

  cancelElectronicInvoice(id: string, reasonCode: string, replacementUuid: string | null, context?: HttpContext): Observable<ElectronicInvoice> {
    return this.api
      .post<unknown, { reasonCode: string; replacementUuid: string | null }>(
        `/api/v1/sales/${encodeURIComponent(id)}/electronic-invoice/cancel`,
        { reasonCode, replacementUuid }, { context },
      )
      .pipe(map(toElectronicInvoice));
  }

  downloadElectronicInvoice(id: string, format: 'xml' | 'pdf', context?: HttpContext): Observable<Blob> {
    return this.api.download(`/api/v1/sales/${encodeURIComponent(id)}/electronic-invoice/files/${format}`, { context });
  }

  getBillingEligibility(id: string, context?: HttpContext): Observable<SaleBillingEligibility> {
    return this.api
      .get<unknown>(`/api/v1/counter-sales/${encodeURIComponent(id)}/billing-eligibility`, { context })
      .pipe(map(toBillingEligibility));
  }

  assignBillingRecipient(
    id: string,
    request: { customerId: string; reason: string; rowVersion: number },
    context?: HttpContext,
  ): Observable<SaleBillingRecipient> {
    return this.api
      .put<unknown, typeof request>(
        `/api/v1/counter-sales/${encodeURIComponent(id)}/billing-recipient`, request, { context },
      )
      .pipe(map(toBillingRecipient));
  }

  getFiscalStatus(id: string, context?: HttpContext): Observable<SaleFiscalStatus> {
    return this.api
      .get<unknown>(`/api/v1/counter-sales/${encodeURIComponent(id)}/fiscal-status`, { context })
      .pipe(map(toFiscalStatus));
  }

  reconcileFiscalCoverage(
    id: string,
    request: { coverageStatus: string; reason: string; globalInvoiceFiscalUuid: string | null; rowVersion: number },
    context?: HttpContext,
  ): Observable<SaleFiscalStatus> {
    return this.api
      .put<unknown, typeof request>(
        `/api/v1/counter-sales/${encodeURIComponent(id)}/fiscal-coverage`, request, { context },
      )
      .pipe(map(toFiscalStatus));
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
    taxId: text(item, 'taxId'),
    fiscalLegalName: text(item, 'fiscalLegalName'),
    fiscalZipCode: text(item, 'fiscalZipCode'),
    taxRegimeCode: text(item, 'taxRegimeCode'),
    defaultCfdiUseCode: text(item, 'defaultCfdiUseCode'),
    invoiceEmail: text(item, 'invoiceEmail'),
    hasCompleteFiscalProfile: bool(item, 'hasCompleteFiscalProfile'),
  };
}

function toBillingEligibility(value: unknown): SaleBillingEligibility {
  const item = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    eligible: bool(item, 'eligible'),
    reasonCode: text(item, 'reasonCode'),
    requiredAction: text(item, 'requiredAction'),
    saleId: text(item, 'saleId'),
    saleStatus: text(item, 'saleStatus'),
    billingCustomerId: text(item, 'billingCustomerId') || null,
    fiscalCoverageStatus: text(item, 'fiscalCoverageStatus'),
    electronicInvoiceStatus: text(item, 'electronicInvoiceStatus') || null,
    rowVersion: number(item, 'rowVersion'),
  };
}

function toBillingRecipient(value: unknown): SaleBillingRecipient {
  const item = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    id: text(item, 'id'), saleId: text(item, 'saleId'), customerId: text(item, 'customerId'),
    status: text(item, 'status'), reason: text(item, 'reason'), assignedAt: text(item, 'assignedAt'),
    assignedBy: text(item, 'assignedBy'), rowVersion: number(item, 'rowVersion'),
  };
}

function toFiscalStatus(value: unknown): SaleFiscalStatus {
  const item = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    saleId: text(item, 'saleId'), coverageStatus: text(item, 'coverageStatus'),
    globalInvoiceFiscalUuid: text(item, 'globalInvoiceFiscalUuid') || null,
    reconciliationReason: text(item, 'reconciliationReason') || null,
    billingCustomerId: text(item, 'billingCustomerId') || null,
    electronicInvoiceStatus: text(item, 'electronicInvoiceStatus') || null,
    rowVersion: number(item, 'rowVersion'),
  };
}

function toPointCardPayment(value: unknown): PointCardPayment {
  const item = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    id: text(item, 'id'),
    saleId: text(item, 'saleId'),
    paymentTerminalId: text(item, 'paymentTerminalId') || null,
    orderId: text(item, 'orderId') || null,
    amount: number(item, 'amount'),
    status: text(item, 'status', 'Pending'),
    statusDetail: text(item, 'statusDetail', 'created'),
    paymentId: text(item, 'paymentId') || null,
    paymentMethodType: text(item, 'paymentMethodType') || null,
    paymentMethodId: text(item, 'paymentMethodId') || null,
    installments: nullableNumber(item, 'installments'),
    completedAt: text(item, 'completedAt') || null,
  };
}

function toElectronicInvoice(value: unknown): ElectronicInvoice {
  const item = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    id: text(item, 'id'), saleId: text(item, 'saleId'), provider: text(item, 'provider'),
    status: text(item, 'status', 'Pending'), providerInvoiceId: text(item, 'providerInvoiceId') || null,
    fiscalUuid: text(item, 'fiscalUuid') || null, issuedAt: text(item, 'issuedAt') || null,
    cancelledAt: text(item, 'cancelledAt') || null,
    cancellationReasonCode: text(item, 'cancellationReasonCode') || null,
    errorCode: text(item, 'errorCode') || null, errorMessage: text(item, 'errorMessage') || null,
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

function nullableNumber(item: Record<string, unknown>, key: string): number | null {
  const value = item[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
