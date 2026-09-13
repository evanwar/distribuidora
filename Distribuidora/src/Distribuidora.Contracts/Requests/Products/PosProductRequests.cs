namespace Distribuidora.Contracts.Requests;

public sealed class PosProductSearchRequest
{
    public Guid WarehouseId { get; set; }
    public string? Search { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? BrandId { get; set; }
    public decimal? MinimumPrice { get; set; }
    public decimal? MaximumPrice { get; set; }
    public bool InStockOnly { get; set; }
    public bool LowStockOnly { get; set; }
    public bool FavoritesOnly { get; set; }
    public bool BestSellersOnly { get; set; }
    public bool ExactBarcode { get; set; }
    public Guid[]? ProductIds { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 30;
}

public sealed class PosFacetRequest
{
    public string Kind { get; set; } = "category";
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public sealed record ProductFavoriteRequest(bool Favorite);
