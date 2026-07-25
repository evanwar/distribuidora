using Distribuidora.Domain.Catalogs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Distribuidora.Infrastructure.Persistence.Configurations;

public sealed class ProductConfiguration :
    IEntityTypeConfiguration<Product>,
    IEntityTypeConfiguration<ProductAlias>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products", "catalogs");
        builder.Audit();
        builder.Property(x => x.Sku).HasMaxLength(50).IsRequired();
        builder.HasIndex(x => x.Sku).IsUnique();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Barcode).HasMaxLength(100);
        builder.HasIndex(x => x.Barcode).IsUnique();
        builder.Property(x => x.Cost).HasPrecision(18, 2);
        builder.Property(x => x.BasePrice).HasPrecision(18, 2);
        builder.Property(x => x.MinimumStock).HasPrecision(18, 4);
        builder.HasOne<Category>().WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Brand>().WithMany().HasForeignKey(x => x.BrandId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Unit>().WithMany().HasForeignKey(x => x.UnitId).OnDelete(DeleteBehavior.Restrict);
    }

    public void Configure(EntityTypeBuilder<ProductAlias> builder)
    {
        builder.ToTable("product_aliases", "catalogs");
        builder.Audit();
        builder.Property(x => x.Alias).HasMaxLength(200).IsRequired();
        builder.HasIndex(x => new { x.ProductId, x.Alias }).IsUnique();
        builder.HasOne(x => x.Product).WithMany(x => x.Aliases).HasForeignKey(x => x.ProductId);
    }
}
