namespace Distribuidora.Contracts.Responses;

public sealed record ProductResponse(
    Guid Id,
    string Sku,
    string Name,
    string? Description,
    Guid CategoryId,
    Guid BrandId,
    Guid UnitId,
    string? Barcode,
    decimal Cost,
    decimal BasePrice,
    decimal MinimumStock,
    bool Active);

public sealed record ProductAliasResponse(
    Guid Id,
    Guid ProductId,
    string Alias,
    bool Active);
