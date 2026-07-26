export interface PosCustomer {
  id: string;
  name: string;
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
