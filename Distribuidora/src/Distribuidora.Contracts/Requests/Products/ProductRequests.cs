namespace Distribuidora.Contracts.Requests;

public sealed record ProductRequest(
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
    bool Active = true);

public sealed record ProductAliasRequest(
    Guid ProductId,
    string Alias,
    bool Active = true);

public sealed record ProductSearchRequest(
    string? Search = null,
    int Page = 1,
    int PageSize = 25);
