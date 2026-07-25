namespace Distribuidora.Contracts.Responses;

public sealed record StockBalanceResponse(Guid Id, Guid WarehouseId, Guid ProductId, decimal Quantity, decimal ReservedQuantity, uint RowVersion);
public sealed record InventoryMovementResponse(Guid Id, string Folio, DateTimeOffset Date, string MovementType, Guid ProductId, decimal Quantity, Guid? SourceWarehouseId, Guid? DestinationWarehouseId, decimal UnitCost, string ReferenceType, Guid ReferenceId, string? Notes, decimal ResultingBalance);
public sealed record AdjustmentItemResponse(Guid Id, Guid ProductId, decimal SystemQuantity, decimal PhysicalQuantity, decimal DifferenceQuantity, decimal UnitCost);
public sealed record InventoryAdjustmentResponse(Guid Id, string Folio, Guid WarehouseId, string Reason, string Status, Guid? AuthorizedBy, DateTimeOffset? ConfirmedAt, DateTimeOffset? CancelledAt, string? CancelReason, IReadOnlyCollection<AdjustmentItemResponse> Items);
public sealed record LowStockResponse(Guid ProductId, string Sku, string Name, decimal MinimumStock, decimal Quantity, Guid? WarehouseId);
