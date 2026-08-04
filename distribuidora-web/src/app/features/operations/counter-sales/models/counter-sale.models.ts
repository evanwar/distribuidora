export interface PosCustomer {
  id: string;
  name: string;
  phone: string;
  creditBlocked: boolean;
}

export interface PosProduct {
  id: string;
  sku: string;
  name: string;
  barcode: string;
  price: number;
}

export interface PosWarehouse {
  id: string;
  name: string;
}

export interface PosStockBalance {
  warehouseId: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
}

export interface PosPaymentMethod {
  code: string;
  name: string;
  requiresReference: boolean;
}

export interface SaleLine {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface CounterSale {
  id: string;
  folio: string;
  saleDate: string;
  customerId?: string | null;
  sourceWarehouseId: string;
  status: string;
  paymentCondition: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  paidAmount: number;
  balance: number;
  notes?: string | null;
  items: readonly CounterSaleItem[];
}

export interface CounterSaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface CreateCounterSale {
  customerId: string | null;
  sourceWarehouseId: string;
  paymentCondition: number;
  taxTotal: number;
  notes: string | null;
  items: readonly {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }[];
  payments: readonly {
    method: string;
    amount: number;
    reference: string | null;
  }[];
}

export interface PointCardPayment {
  id: string;
  saleId: string;
  orderId: string | null;
  amount: number;
  status: string;
  statusDetail: string;
  paymentId: string | null;
  paymentMethodType: string | null;
  paymentMethodId: string | null;
  installments: number | null;
  completedAt: string | null;
}

export interface ElectronicInvoice {
  id: string;
  saleId: string;
  provider: string;
  status: string;
  providerInvoiceId: string | null;
  fiscalUuid: string | null;
  issuedAt: string | null;
  cancelledAt: string | null;
  cancellationReasonCode: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface IssueElectronicInvoice {
  paymentFormCode: string;
  recipient: {
    taxId: string;
    legalName: string;
    zipCode: string;
    taxRegimeCode: string;
    cfdiUseCode: string;
    email: string | null;
  };
  items: readonly {
    productId: string;
    satProductCode: string;
    satUnitCode: string;
    taxObjectCode: string;
    taxes: readonly {
      taxCode: string;
      taxTypeCode: string;
      rate: number;
      taxFlagCode: string;
    }[];
  }[];
}
