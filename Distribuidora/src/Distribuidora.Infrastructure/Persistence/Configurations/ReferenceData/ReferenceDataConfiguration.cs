using Distribuidora.Domain.Catalogs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Distribuidora.Infrastructure.Persistence.Configurations;

public sealed class ReferenceDataConfiguration :
    IEntityTypeConfiguration<Category>,
    IEntityTypeConfiguration<Brand>,
    IEntityTypeConfiguration<Unit>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories", "catalogs");
        ConfigureNamed(builder);
    }

    public void Configure(EntityTypeBuilder<Brand> builder)
    {
        builder.ToTable("brands", "catalogs");
        ConfigureNamed(builder);
    }

    public void Configure(EntityTypeBuilder<Unit> builder)
    {
        builder.ToTable("units", "catalogs");
        ConfigureNamed(builder);
        builder.Property(x => x.Abbreviation).HasMaxLength(20);
    }

    private static void ConfigureNamed<T>(EntityTypeBuilder<T> builder)
        where T : NamedCatalog
    {
        builder.Audit();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.HasIndex(x => x.Name).IsUnique();
    }
}
