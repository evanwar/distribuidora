using Distribuidora.Contracts.Responses;
using Distribuidora.Domain.AccountsReceivable;
using Distribuidora.Domain.Administration;
using Distribuidora.Domain.Audits;
using Distribuidora.Domain.Catalogs;
using Distribuidora.Domain.Inventory;
using Distribuidora.Domain.Purchases;
using Distribuidora.Domain.Sales;
using Distribuidora.Domain.Security;

namespace Distribuidora.Api.Common;

internal static class HttpResponseMapper
{
    public static UserResponse Map(User x) => new(x.Id, x.Name, x.Username, x.Email, x.Active, x.LastAccessAt);
    public static RoleResponse Map(Role x) => new(x.Id, x.Name, x.Description, x.Active, x.Permissions.Select(p => p.Key).ToArray());
    public static PermissionResponse Map(Permission x) => new(x.Key, x.Module, x.Action, x.Description);
    public static ProductResponse Map(Product x) => new(x.Id, x.Sku, x.Name, x.Description, x.CategoryId, x.BrandId, x.UnitId, x.Barcode, x.Cost, x.BasePrice, x.MinimumStock, x.Active);
    public static NamedCatalogResponse Map(NamedCatalog x) => new(x.Id, x.Name, x.Description, x.Active);
    public static UnitResponse Map(Unit x) => new(x.Id, x.Name, x.Abbreviation, x.AllowsDecimals, x.Active);
    public static CustomerResponse Map(Customer x) => new(x.Id, x.Name, x.TaxId, x.Phone, x.Email, x.Address, x.City, x.CreditLimit, x.CreditBlocked, x.Active);
    public static SupplierResponse Map(Supplier x) => new(x.Id, x.Name, x.ContactName, x.Phone, x.Email, x.Address, x.Active);
    public static WarehouseResponse Map(Warehouse x) => new(x.Id, x.Name, x.Type.ToString(), x.Active);
    public static ProductAliasResponse Map(ProductAlias x) => new(x.Id, x.ProductId, x.Alias, x.Active);
    public static StockBalanceResponse Map(StockBalance x) => new(x.Id, x.WarehouseId, x.ProductId, x.Quantity, x.ReservedQuantity, x.RowVersion);
    public static InventoryMovementResponse Map(InventoryMovement x) => new(x.Id, x.Folio, x.Date, x.MovementType.ToString(), x.ProductId, x.Quantity, x.SourceWarehouseId, x.DestinationWarehouseId, x.UnitCost, x.ReferenceType, x.ReferenceId, x.Notes, x.ResultingBalance);
    public static InventoryAdjustmentResponse Map(InventoryAdjustment x) => new(x.Id, x.Folio, x.WarehouseId, x.Reason, x.Status.ToString(), x.AuthorizedBy, x.ConfirmedAt, x.CancelledAt, x.CancelReason, x.Items.Select(i => new AdjustmentItemResponse(i.Id, i.ProductId, i.SystemQuantity, i.PhysicalQuantity, i.DifferenceQuantity, i.UnitCost)).ToArray());
    public static PurchaseResponse Map(PurchaseOrder x) => new(x.Id, x.Folio, x.SupplierId, x.Date, x.Status.ToString(), x.Subtotal, x.Tax, x.Total, x.Notes, x.CancelReason, x.Items.Select(i => new PurchaseItemResponse(i.Id, i.ProductId, i.Quantity, i.UnitCost, i.Discount, i.Total)).ToArray());
    public static GoodsReceiptResponse Map(GoodsReceipt x) => new(x.Id, x.Folio, x.PurchaseOrderId, x.SupplierId, x.DestinationWarehouseId, x.ReceivedAt, x.ReceivedBy, x.Status.ToString(), x.Notes, x.CancelReason, x.Items.Select(i => new ReceiptItemResponse(i.Id, i.ProductId, i.ReceivedQuantity, i.UnitCost, i.Total)).ToArray());
    public static CounterSaleResponse Map(CounterSale x) => new(x.Id, x.Folio, x.SaleDate, x.CustomerId, x.SourceWarehouseId, x.Status.ToString(), x.PaymentCondition.ToString(), x.Subtotal, x.DiscountTotal, x.TaxTotal, x.Total, x.PaidAmount, x.Balance, x.Notes, x.Items.Select(i => new SaleItemResponse(i.Id, i.ProductId, i.Quantity, i.UnitPrice, i.Discount, i.Total, i.HistoricalUnitCost)).ToArray(), x.Payments.Select(i => new SalePaymentResponse(i.Id, i.PaymentDate, i.Method, i.Amount, i.Reference, i.ReceivedBy)).ToArray(), x.Cancellation is null ? null : new SaleCancellationResponse(x.Cancellation.Reason, x.Cancellation.CancelledBy, x.Cancellation.CancelledAt, x.Cancellation.InventoryReverted, x.Cancellation.PaymentsReverted));
    public static PointCardPaymentResponse Map(PointPayment x) => new(
        x.Id, x.SaleId, x.OrderId, x.Amount, x.Status.ToString(), x.StatusDetail, x.PaymentId,
        x.PaymentMethodType, x.PaymentMethodId, x.Installments, x.CompletedAt);
    public static PaymentAllocationResponse Map(PaymentAllocation x) => new(x.Id, x.CustomerPaymentId, x.AccountReceivableId, x.AmountApplied, x.Reversed);
    public static AccountReceivableResponse Map(AccountReceivable x) => new(x.Id, x.CustomerId, x.SaleId, x.IssueDate, x.DueDate, x.Total, x.Balance, x.Status.ToString(), x.Allocations.Select(Map).ToArray());
    public static CustomerPaymentResponse Map(CustomerPayment x) => new(x.Id, x.CustomerId, x.PaymentDate, x.Method, x.Amount, x.Reference, x.ReceivedBy, x.Status.ToString(), x.CancelReason, x.AvailableAmount, x.Allocations.Select(Map).ToArray());
    public static AuditLogResponse Map(AuditLog x) => new(x.Id, x.UserId, x.Action, x.Module, x.EntityName, x.EntityId, x.BeforeData, x.AfterData, x.IpAddress, x.CorrelationId, x.OperationId, x.TransactionId, x.TraceId, x.EventId, x.CausationId, x.ReferenceFolio, x.OccurredAt);
    public static AuditLogResponse MapAuditSummary(AuditLog x) => new(x.Id, x.UserId, x.Action, x.Module, x.EntityName, x.EntityId, null, null, x.IpAddress, x.CorrelationId, x.OperationId, x.TransactionId, x.TraceId, x.EventId, x.CausationId, x.ReferenceFolio, x.OccurredAt);
    public static CancellationReasonResponse Map(CancellationReason x) => new(x.Id, x.Code, x.Description, x.Module, x.RequiresAuthorization, x.Active);
    public static OperationalNoteResponse Map(OperationalNote x) => new(x.Id, x.EntityName, x.EntityId, x.Note, x.CreatedBy, x.CreatedAt);
    public static SystemSettingResponse Map(SystemSetting x) => new(x.Id, x.Key, x.Value, x.DataType, x.Description, x.Module, x.UpdatedBy, x.UpdatedAt);
    public static FolioSequenceResponse Map(FolioSequence x) => new(x.Id, x.DocumentType, x.Prefix, x.CurrentNumber, x.Padding, x.Active);
    public static PaymentMethodResponse Map(PaymentMethod x) => new(x.Id, x.Code, x.Name, x.RequiresReference, x.Active);
    public static CreditPolicyResponse Map(CreditPolicy x) => new(x.Id, x.AllowCreditSales, x.DefaultDueDays, x.RequireAuthorizationOverLimit, x.Active);
    public static InventoryPolicyResponse Map(InventoryPolicy x) => new(x.Id, x.AllowNegativeStock, x.RequireReasonForAdjustment, x.Active);
}
