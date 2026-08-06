using Distribuidora.Domain.Catalogs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Distribuidora.Infrastructure.Persistence.Configurations;

public sealed class CustomerConfiguration : IEntityTypeConfiguration<Customer>, IEntityTypeConfiguration<CustomerFiscalProfile>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("customers", "catalogs");
        builder.Audit();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.CreditLimit).HasPrecision(18, 2);
        builder.Property(x => x.TaxId).HasMaxLength(30);
        builder.HasIndex(x => x.TaxId).IsUnique();
        builder.HasOne(x => x.FiscalProfile).WithOne().HasForeignKey<CustomerFiscalProfile>(x => x.CustomerId);
        builder.Navigation(x => x.FiscalProfile).AutoInclude();
    }

    public void Configure(EntityTypeBuilder<CustomerFiscalProfile> builder)
    {
        builder.ToTable("customer_fiscal_profiles", "catalogs");
        builder.Audit();
        builder.Property(x => x.TaxId).HasMaxLength(13).IsRequired();
        builder.Property(x => x.LegalName).HasMaxLength(254).IsRequired();
        builder.Property(x => x.FiscalZipCode).HasMaxLength(5).IsRequired();
        builder.Property(x => x.TaxRegimeCode).HasMaxLength(3).IsRequired();
        builder.Property(x => x.DefaultCfdiUseCode).HasMaxLength(4);
        builder.Property(x => x.InvoiceEmail).HasMaxLength(254);
        builder.HasIndex(x => x.CustomerId).IsUnique();
        builder.HasIndex(x => x.TaxId).IsUnique();
    }
}
