using Distribuidora.Domain.Catalogs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Distribuidora.Infrastructure.Persistence.Configurations;

public sealed class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("customers", "catalogs");
        builder.Audit();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.CreditLimit).HasPrecision(18, 2);
        builder.Property(x => x.TaxId).HasMaxLength(30);
        builder.HasIndex(x => x.TaxId).IsUnique();
    }
}
