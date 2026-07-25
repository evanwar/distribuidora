namespace Distribuidora.Contracts.Responses;

public sealed record PurchaseItemResponse(Guid Id, Guid ProductId, decimal Quantity, decimal UnitCost, decimal Discount, decimal Total);
public sealed record PurchaseResponse(Guid Id, string Folio, Guid SupplierId, DateTimeOffset Date, string Status, decimal Subtotal, decimal Tax, decimal Total, string? Notes, string? CancelReason, IReadOnlyCollection<PurchaseItemResponse> Items);
public sealed record ReceiptItemResponse(Guid Id, Guid ProductId, decimal ReceivedQuantity, decimal UnitCost, decimal Total);
public sealed record GoodsReceiptResponse(Guid Id, string Folio, Guid? PurchaseOrderId, Guid SupplierId, Guid DestinationWarehouseId, DateTimeOffset ReceivedAt, Guid ReceivedBy, string Status, string? Notes, string? CancelReason, IReadOnlyCollection<ReceiptItemResponse> Items);
