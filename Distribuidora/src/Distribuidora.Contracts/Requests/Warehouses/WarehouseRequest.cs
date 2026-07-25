namespace Distribuidora.Contracts.Requests;

public enum WarehouseType { Central, Counter }

public sealed record WarehouseRequest(
    string Name,
    WarehouseType Type,
    bool Active = true);
