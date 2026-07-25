namespace Distribuidora.Contracts.Responses;

public sealed record WarehouseResponse(
    Guid Id,
    string Name,
    string Type,
    bool Active);
