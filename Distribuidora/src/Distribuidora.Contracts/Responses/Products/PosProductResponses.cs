namespace Distribuidora.Contracts.Responses;

public sealed record PosProductResponse(Guid Id, string Name, string Sku, string? Barcode,
    decimal Price, decimal AvailableStock, decimal MinimumStock, Guid CategoryId, string CategoryName,
    Guid BrandId, string BrandName, bool Favorite, decimal SoldQuantity);

public sealed record PosFacetResponse(Guid Id, string Name);
