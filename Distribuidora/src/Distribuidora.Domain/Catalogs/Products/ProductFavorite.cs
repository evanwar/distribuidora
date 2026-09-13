namespace Distribuidora.Domain.Catalogs;

public sealed class ProductFavorite
{
    public Guid UserId { get; set; }
    public Guid ProductId { get; set; }
}
