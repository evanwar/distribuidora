namespace Distribuidora.Contracts.Requests;

public sealed record AdjustmentItemRequest(Guid ProductId, decimal PhysicalQuantity, decimal UnitCost);
public sealed record CreateAdjustmentRequest(Guid WarehouseId, string Reason, IReadOnlyCollection<AdjustmentItemRequest> Items);
public sealed record TransferRequest(Guid ProductId, Guid SourceWarehouseId, Guid DestinationWarehouseId, decimal Quantity, decimal UnitCost, string Notes);
public sealed record InventoryBalanceQuery(Guid? WarehouseId = null, Guid? ProductId = null);
public sealed record KardexQuery(Guid ProductId, Guid? WarehouseId = null, DateTimeOffset? From = null, DateTimeOffset? To = null);
