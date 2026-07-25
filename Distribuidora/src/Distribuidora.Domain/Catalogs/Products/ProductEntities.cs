using Distribuidora.Domain.Common;

namespace Distribuidora.Domain.Catalogs;

public sealed class Product : AuditableEntity
{
    public string Sku { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public Guid CategoryId { get; set; }
    public Guid BrandId { get; set; }
    public Guid UnitId { get; set; }
    public string? Barcode { get; set; }
    public decimal Cost { get; set; }
    public decimal BasePrice { get; set; }
    public decimal MinimumStock { get; set; }
    public bool Active { get; set; } = true;
    public ICollection<ProductAlias> Aliases { get; set; } = [];
}

public sealed class ProductAlias : AuditableEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string Alias { get; set; } = "";
    public bool Active { get; set; } = true;
}
