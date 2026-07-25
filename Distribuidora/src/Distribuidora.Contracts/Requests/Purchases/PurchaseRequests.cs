namespace Distribuidora.Contracts.Requests;

public sealed record PurchaseItemRequest(Guid ProductId, decimal Quantity, decimal UnitCost, decimal Discount);
public sealed record CreatePurchaseRequest(Guid SupplierId, decimal Tax, string? Notes, IReadOnlyCollection<PurchaseItemRequest> Items);
public sealed record ReceiptItemRequest(Guid ProductId, decimal Quantity, decimal UnitCost);
public sealed record CreateReceiptRequest(Guid SupplierId, Guid? PurchaseOrderId, Guid DestinationWarehouseId, string? Notes, IReadOnlyCollection<ReceiptItemRequest> Items);
