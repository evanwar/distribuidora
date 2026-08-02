# Modelos TypeScript

[← Índice](./README.md)

Tipos generados desde `components.schemas` del contrato OpenAPI. Los campos marcados con `?` no aparecen como obligatorios en el contrato.

## AdjustmentItemRequest

```ts
export interface AdjustmentItemRequest {
  productId?: string;
  physicalQuantity?: number;
  unitCost?: number;
}
```

## AdjustmentItemResponse

```ts
export interface AdjustmentItemResponse {
  id?: string;
  productId?: string;
  systemQuantity?: number;
  physicalQuantity?: number;
  differenceQuantity?: number;
  unitCost?: number;
}
```

## AllocationItemRequest

```ts
export interface AllocationItemRequest {
  accountReceivableId?: string;
  amount?: number;
}
```

## ApplyPaymentRequest

```ts
export interface ApplyPaymentRequest {
  allocations?: Array<AllocationItemRequest> | null;
}
```

## AssignIdsRequest

```ts
export interface AssignIdsRequest {
  ids?: Array<string> | null;
}
```

## AssignPermissionsRequest

```ts
export interface AssignPermissionsRequest {
  permissionKeys?: Array<string> | null;
}
```

## AuthResponse

```ts
export interface AuthResponse {
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: string;
}
```

## AuthResponseApiResponse

```ts
export interface AuthResponseApiResponse {
  success?: boolean;
  data?: AuthResponse;
  message?: string | null;
  errors?: Array<string> | null;
  correlationId?: string | null;
}
```

## CancellationReasonRequest

```ts
export interface CancellationReasonRequest {
  code?: string | null;
  description?: string | null;
  module?: string | null;
  requiresAuthorization?: boolean;
  active?: boolean;
}
```

## CancelRequest

```ts
export interface CancelRequest {
  reason?: string | null;
}
```

## ChangeCreditLimitRequest

```ts
export interface ChangeCreditLimitRequest {
  newLimit?: number;
  reason?: string | null;
}
```

## CreateAdjustmentRequest

```ts
export interface CreateAdjustmentRequest {
  warehouseId?: string;
  reason?: string | null;
  items?: Array<AdjustmentItemRequest> | null;
}
```

## CreatePurchaseRequest

```ts
export interface CreatePurchaseRequest {
  supplierId?: string;
  tax?: number;
  notes?: string | null;
  items?: Array<PurchaseItemRequest> | null;
}
```

## CreateReceiptRequest

```ts
export interface CreateReceiptRequest {
  supplierId?: string;
  purchaseOrderId?: string | null;
  destinationWarehouseId?: string;
  notes?: string | null;
  items?: Array<ReceiptItemRequest> | null;
}
```

## CreateRoleRequest

```ts
export interface CreateRoleRequest {
  name?: string | null;
  description?: string | null;
}
```

## CreateSaleRequest

```ts
export interface CreateSaleRequest {
  customerId?: string | null;
  sourceWarehouseId?: string;
  paymentCondition?: PaymentCondition;
  taxTotal?: number;
  notes?: string | null;
  items?: Array<SaleItemRequest> | null;
  payments?: Array<SalePaymentRequest> | null;
}
```

## CreateUserRequest

```ts
export interface CreateUserRequest {
  name?: string | null;
  username?: string | null;
  email?: string | null;
  password?: string | null;
  roleIds?: Array<string> | null;
}
```

## CreditPolicyRequest

```ts
export interface CreditPolicyRequest {
  allowCreditSales?: boolean;
  defaultDueDays?: number;
  requireAuthorizationOverLimit?: boolean;
  active?: boolean;
}
```

## CustomerPaymentRequest

```ts
export interface CustomerPaymentRequest {
  customerId?: string;
  method?: string | null;
  amount?: number;
  reference?: string | null;
}
```

## CustomerRequest

```ts
export interface CustomerRequest {
  name?: string | null;
  taxId?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  creditLimit?: number;
  creditBlocked?: boolean;
  active?: boolean;
}
```

## ErrorResolutionRequest

```ts
export interface ErrorResolutionRequest {
  notes?: string | null;
}
```

## FolioSequenceRequest

```ts
export interface FolioSequenceRequest {
  documentType?: string | null;
  prefix?: string | null;
  currentNumber?: number;
  padding?: number;
  active?: boolean;
}
```

## HealthResponse

```ts
export interface HealthResponse {
  status?: string | null;
  utc?: string;
}
```

## HealthResponseApiResponse

```ts
export interface HealthResponseApiResponse {
  success?: boolean;
  data?: HealthResponse;
  message?: string | null;
  errors?: Array<string> | null;
  correlationId?: string | null;
}
```

## InventoryAdjustmentResponse

```ts
export interface InventoryAdjustmentResponse {
  id?: string;
  folio?: string | null;
  warehouseId?: string;
  reason?: string | null;
  status?: string | null;
  authorizedBy?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  items?: Array<AdjustmentItemResponse> | null;
}
```

## InventoryAdjustmentResponseApiResponse

```ts
export interface InventoryAdjustmentResponseApiResponse {
  success?: boolean;
  data?: InventoryAdjustmentResponse;
  message?: string | null;
  errors?: Array<string> | null;
  correlationId?: string | null;
}
```

## InventoryPolicyRequest

```ts
export interface InventoryPolicyRequest {
  allowNegativeStock?: boolean;
  requireReasonForAdjustment?: boolean;
  active?: boolean;
}
```

## LoginRequest

```ts
export interface LoginRequest {
  username?: string | null;
  password?: string | null;
}
```

## NamedCatalogRequest

```ts
export interface NamedCatalogRequest {
  name?: string | null;
  description?: string | null;
  active?: boolean;
}
```

## ObjectApiResponse

```ts
export interface ObjectApiResponse {
  success?: boolean;
  data?: unknown | null;
  message?: string | null;
  errors?: Array<string> | null;
  correlationId?: string | null;
}
```

## OperationalNoteRequest

```ts
export interface OperationalNoteRequest {
  entityName?: string | null;
  entityId?: string;
  note?: string | null;
}
```

## OperationResponse

```ts
export interface OperationResponse {
  completed?: boolean;
}
```

## OperationResponseApiResponse

```ts
export interface OperationResponseApiResponse {
  success?: boolean;
  data?: OperationResponse;
  message?: string | null;
  errors?: Array<string> | null;
  correlationId?: string | null;
}
```

## PaymentCondition

```ts
export type PaymentCondition = 0 | 1 | 2;
```

## PaymentMethodRequest

```ts
export interface PaymentMethodRequest {
  code?: string | null;
  name?: string | null;
  requiresReference?: boolean;
  active?: boolean;
}
```

## ProductAliasRequest

```ts
export interface ProductAliasRequest {
  productId?: string;
  alias?: string | null;
  active?: boolean;
}
```

## ProductRequest

```ts
export interface ProductRequest {
  sku?: string | null;
  name?: string | null;
  description?: string | null;
  categoryId?: string;
  brandId?: string;
  unitId?: string;
  barcode?: string | null;
  cost?: number;
  basePrice?: number;
  minimumStock?: number;
  active?: boolean;
}
```

## ProductResponse

```ts
export interface ProductResponse {
  id?: string;
  sku?: string | null;
  name?: string | null;
  description?: string | null;
  categoryId?: string;
  brandId?: string;
  unitId?: string;
  barcode?: string | null;
  cost?: number;
  basePrice?: number;
  minimumStock?: number;
  active?: boolean;
}
```

## ProductResponseApiResponse

```ts
export interface ProductResponseApiResponse {
  success?: boolean;
  data?: ProductResponse;
  message?: string | null;
  errors?: Array<string> | null;
  correlationId?: string | null;
}
```

## PurchaseItemRequest

```ts
export interface PurchaseItemRequest {
  productId?: string;
  quantity?: number;
  unitCost?: number;
  discount?: number;
}
```

## ReceiptItemRequest

```ts
export interface ReceiptItemRequest {
  productId?: string;
  quantity?: number;
  unitCost?: number;
}
```

## RefreshRequest

```ts
export interface RefreshRequest {
  refreshToken?: string | null;
}
```

## RoleResponse

```ts
export interface RoleResponse {
  id?: string;
  name?: string | null;
  description?: string | null;
  active?: boolean;
  permissions?: Array<string> | null;
}
```

## RoleResponseApiResponse

```ts
export interface RoleResponseApiResponse {
  success?: boolean;
  data?: RoleResponse;
  message?: string | null;
  errors?: Array<string> | null;
  correlationId?: string | null;
}
```

## SaleItemRequest

```ts
export interface SaleItemRequest {
  productId?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
}
```

## SalePaymentRequest

```ts
export interface SalePaymentRequest {
  method?: string | null;
  amount?: number;
  reference?: string | null;
}
```

## SupplierRequest

```ts
export interface SupplierRequest {
  name?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  active?: boolean;
}
```

## TransferRequest

```ts
export interface TransferRequest {
  productId?: string;
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  quantity?: number;
  unitCost?: number;
  notes?: string | null;
}
```

## UnitRequest

```ts
export interface UnitRequest {
  name?: string | null;
  abbreviation?: string | null;
  allowsDecimals?: boolean;
  active?: boolean;
}
```

## UpdateSettingRequest

```ts
export interface UpdateSettingRequest {
  value?: string | null;
  dataType?: string | null;
  description?: string | null;
  module?: string | null;
}
```

## UpdateUserRequest

```ts
export interface UpdateUserRequest {
  name?: string | null;
  email?: string | null;
  active?: boolean;
}
```

## UserResponse

```ts
export interface UserResponse {
  id?: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  active?: boolean;
  lastAccessAt?: string | null;
}
```

## UserResponseApiResponse

```ts
export interface UserResponseApiResponse {
  success?: boolean;
  data?: UserResponse;
  message?: string | null;
  errors?: Array<string> | null;
  correlationId?: string | null;
}
```

## UserResponseIReadOnlyCollectionApiResponse

```ts
export interface UserResponseIReadOnlyCollectionApiResponse {
  success?: boolean;
  data?: Array<UserResponse> | null;
  message?: string | null;
  errors?: Array<string> | null;
  correlationId?: string | null;
}
```

## WarehouseRequest

```ts
export interface WarehouseRequest {
  name?: string | null;
  type?: WarehouseType;
  active?: boolean;
}
```

## WarehouseType

```ts
export type WarehouseType = 0 | 1;
```
