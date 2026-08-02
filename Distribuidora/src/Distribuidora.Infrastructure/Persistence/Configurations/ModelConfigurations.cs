using Distribuidora.Domain.AccountsReceivable;
using Distribuidora.Domain.Administration;
using Distribuidora.Domain.Audits;
using Distribuidora.Domain.Catalogs;
using Distribuidora.Domain.Common;
using Distribuidora.Domain.Inventory;
using Distribuidora.Domain.Purchases;
using Distribuidora.Domain.Sales;
using Distribuidora.Domain.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Distribuidora.Infrastructure.Persistence.Configurations;

internal static class ConfigurationHelpers
{
    public static void Audit<T>(this EntityTypeBuilder<T> b) where T : AuditableEntity
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.CreatedAt).HasColumnType("timestamptz");
        b.Property(x => x.UpdatedAt).HasColumnType("timestamptz");
        b.Property(x => x.RowVersion).IsConcurrencyToken();
        b.Ignore(x => x.DomainEvents);
    }

    public static void Entity<T>(this EntityTypeBuilder<T> b) where T : Entity
    {
        b.HasKey(x => x.Id);
        b.Ignore(x => x.DomainEvents);
    }
}

public sealed class SecurityConfiguration :
    IEntityTypeConfiguration<User>, IEntityTypeConfiguration<Role>, IEntityTypeConfiguration<Permission>, IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.ToTable("users", "security"); b.Audit();
        b.Property(x => x.Name).HasMaxLength(200).IsRequired();
        b.Property(x => x.Username).HasMaxLength(100).IsRequired(); b.HasIndex(x => x.Username).IsUnique();
        b.Property(x => x.Email).HasMaxLength(254).IsRequired(); b.HasIndex(x => x.Email).IsUnique();
        b.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
        b.HasMany(x => x.Roles).WithMany(x => x.Users).UsingEntity("user_roles");
        b.Navigation(x => x.Roles).AutoInclude();
    }
    public void Configure(EntityTypeBuilder<Role> b)
    {
        b.ToTable("roles", "security"); b.Audit();
        b.Property(x => x.Name).HasMaxLength(100).IsRequired(); b.HasIndex(x => x.Name).IsUnique();
        b.HasMany(x => x.Permissions).WithMany(x => x.Roles).UsingEntity("role_permissions");
        b.Navigation(x => x.Permissions).AutoInclude();
    }
    public void Configure(EntityTypeBuilder<Permission> b)
    {
        b.ToTable("permissions", "security"); b.HasKey(x => x.Key);
        b.Property(x => x.Key).HasMaxLength(150); b.Property(x => x.Module).HasMaxLength(50); b.Property(x => x.Action).HasMaxLength(100);
    }
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.ToTable("refresh_tokens", "security"); b.Entity();
        b.Property(x => x.RowVersion).IsConcurrencyToken();
        b.Property(x => x.TokenHash).HasMaxLength(200).IsRequired(); b.HasIndex(x => x.TokenHash).IsUnique();
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
    }
}

public sealed class InventoryConfiguration :
    IEntityTypeConfiguration<StockBalance>, IEntityTypeConfiguration<InventoryMovement>,
    IEntityTypeConfiguration<InventoryAdjustment>, IEntityTypeConfiguration<InventoryAdjustmentItem>
{
    public void Configure(EntityTypeBuilder<StockBalance> b)
    {
        b.ToTable("stock_balances", "inventory"); b.Audit();
        b.Property(x => x.Quantity).HasPrecision(18, 4); b.Property(x => x.ReservedQuantity).HasPrecision(18, 4);
        b.HasIndex(x => new { x.WarehouseId, x.ProductId }).IsUnique();
        b.HasOne<Warehouse>().WithMany().HasForeignKey(x => x.WarehouseId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<Product>().WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
    }
    public void Configure(EntityTypeBuilder<InventoryMovement> b)
    {
        b.ToTable("inventory_movements", "inventory"); b.Audit();
        b.Property(x => x.Folio).HasMaxLength(50); b.HasIndex(x => x.Folio).IsUnique();
        b.Property(x => x.Quantity).HasPrecision(18, 4); b.Property(x => x.UnitCost).HasPrecision(18, 2); b.Property(x => x.ResultingBalance).HasPrecision(18, 4);
        b.HasIndex(x => new { x.ProductId, x.Date }); b.HasIndex(x => new { x.ReferenceType, x.ReferenceId });
    }
    public void Configure(EntityTypeBuilder<InventoryAdjustment> b)
    {
        b.ToTable("inventory_adjustments", "inventory"); b.Audit(); b.Property(x => x.Folio).HasMaxLength(50); b.HasIndex(x => x.Folio).IsUnique();
        b.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.InventoryAdjustmentId); b.Navigation(x => x.Items).AutoInclude();
    }
    public void Configure(EntityTypeBuilder<InventoryAdjustmentItem> b)
    {
        b.ToTable("inventory_adjustment_items", "inventory"); b.Entity();
        b.Property(x => x.SystemQuantity).HasPrecision(18, 4); b.Property(x => x.PhysicalQuantity).HasPrecision(18, 4);
        b.Ignore(x => x.DifferenceQuantity); b.Property(x => x.UnitCost).HasPrecision(18, 2);
    }
}

public sealed class PurchaseConfiguration :
    IEntityTypeConfiguration<PurchaseOrder>, IEntityTypeConfiguration<PurchaseOrderItem>,
    IEntityTypeConfiguration<GoodsReceipt>, IEntityTypeConfiguration<GoodsReceiptItem>
{
    public void Configure(EntityTypeBuilder<PurchaseOrder> b)
    {
        b.ToTable("purchase_orders", "purchases"); b.Audit(); b.Property(x => x.Folio).HasMaxLength(50); b.HasIndex(x => x.Folio).IsUnique();
        b.Property(x => x.Subtotal).HasPrecision(18, 2); b.Property(x => x.Tax).HasPrecision(18, 2); b.Property(x => x.Total).HasPrecision(18, 2);
        b.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.PurchaseOrderId); b.Navigation(x => x.Items).AutoInclude();
    }
    public void Configure(EntityTypeBuilder<PurchaseOrderItem> b)
    {
        b.ToTable("purchase_order_items", "purchases", t => t.HasCheckConstraint("CK_purchase_order_items_integrity", "\"Quantity\" > 0 AND \"UnitCost\" >= 0 AND \"Discount\" >= 0 AND \"Discount\" <= \"Quantity\" * \"UnitCost\"")); b.Entity();
        b.Property(x => x.Quantity).HasPrecision(18, 4); b.Property(x => x.UnitCost).HasPrecision(18, 2); b.Property(x => x.Discount).HasPrecision(18, 2); b.Ignore(x => x.Total);
    }
    public void Configure(EntityTypeBuilder<GoodsReceipt> b)
    {
        b.ToTable("goods_receipts", "purchases"); b.Audit(); b.Property(x => x.Folio).HasMaxLength(50); b.HasIndex(x => x.Folio).IsUnique();
        b.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.GoodsReceiptId); b.Navigation(x => x.Items).AutoInclude();
    }
    public void Configure(EntityTypeBuilder<GoodsReceiptItem> b)
    {
        b.ToTable("goods_receipt_items", "purchases", t => t.HasCheckConstraint("CK_goods_receipt_items_integrity", "\"ReceivedQuantity\" > 0 AND \"UnitCost\" >= 0")); b.Entity();
        b.Property(x => x.ReceivedQuantity).HasPrecision(18, 4); b.Property(x => x.UnitCost).HasPrecision(18, 2); b.Ignore(x => x.Total);
    }
}

public sealed class SalesConfiguration :
    IEntityTypeConfiguration<CounterSale>, IEntityTypeConfiguration<CounterSaleItem>,
    IEntityTypeConfiguration<SalePayment>, IEntityTypeConfiguration<SaleCancellation>,
    IEntityTypeConfiguration<PointPayment>
{
    public void Configure(EntityTypeBuilder<CounterSale> b)
    {
        b.ToTable("counter_sales", "sales"); b.Audit(); b.Property(x => x.Folio).HasMaxLength(50); b.HasIndex(x => x.Folio).IsUnique();
        foreach (var name in new[] { nameof(CounterSale.Subtotal), nameof(CounterSale.DiscountTotal), nameof(CounterSale.TaxTotal), nameof(CounterSale.Total), nameof(CounterSale.PaidAmount), nameof(CounterSale.Balance) }) b.Property<decimal>(name).HasPrecision(18, 2);
        b.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.SaleId); b.HasMany(x => x.Payments).WithOne().HasForeignKey(x => x.SaleId);
        b.HasOne(x => x.Cancellation).WithOne().HasForeignKey<SaleCancellation>(x => x.SaleId);
        b.Navigation(x => x.Items).AutoInclude(); b.Navigation(x => x.Payments).AutoInclude(); b.Navigation(x => x.Cancellation).AutoInclude();
    }
    public void Configure(EntityTypeBuilder<CounterSaleItem> b)
    {
        b.ToTable("counter_sale_items", "sales"); b.Entity(); b.Property(x => x.Quantity).HasPrecision(18, 4);
        b.Property(x => x.UnitPrice).HasPrecision(18, 2); b.Property(x => x.Discount).HasPrecision(18, 2); b.Ignore(x => x.Total); b.Property(x => x.HistoricalUnitCost).HasPrecision(18, 2);
        b.ToTable(t => t.HasCheckConstraint("CK_counter_sale_items_integrity", "\"Quantity\" > 0 AND \"UnitPrice\" >= 0 AND \"Discount\" >= 0 AND \"Discount\" <= \"Quantity\" * \"UnitPrice\""));
    }
    public void Configure(EntityTypeBuilder<SalePayment> b) { b.ToTable("sale_payments", "sales", t => t.HasCheckConstraint("CK_sale_payments_positive", "\"Amount\" > 0")); b.Entity(); b.Property(x => x.Amount).HasPrecision(18, 2); b.HasIndex(x => new { x.SaleId, x.Reference }).IsUnique(); }
    public void Configure(EntityTypeBuilder<SaleCancellation> b) { b.ToTable("sale_cancellations", "sales"); b.Entity(); }
    public void Configure(EntityTypeBuilder<PointPayment> b)
    {
        b.ToTable("point_payments", "sales"); b.Audit();
        b.Property(x => x.ExternalReference).HasMaxLength(64).IsRequired();
        b.Property(x => x.IdempotencyKey).HasMaxLength(100).IsRequired();
        b.Property(x => x.TerminalId).HasMaxLength(150).IsRequired();
        b.Property(x => x.OrderId).HasMaxLength(100);
        b.Property(x => x.PaymentId).HasMaxLength(100);
        b.Property(x => x.StatusDetail).HasMaxLength(100).IsRequired();
        b.Property(x => x.PaymentMethodType).HasMaxLength(50);
        b.Property(x => x.PaymentMethodId).HasMaxLength(100);
        b.Property(x => x.Amount).HasPrecision(18, 2);
        b.HasIndex(x => x.ExternalReference).IsUnique();
        b.HasIndex(x => x.IdempotencyKey).IsUnique();
        b.HasIndex(x => x.OrderId).IsUnique();
        b.HasIndex(x => new { x.SaleId, x.Status });
        b.HasOne<CounterSale>().WithMany().HasForeignKey(x => x.SaleId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class ReceivableConfiguration :
    IEntityTypeConfiguration<AccountReceivable>, IEntityTypeConfiguration<CustomerPayment>,
    IEntityTypeConfiguration<PaymentAllocation>, IEntityTypeConfiguration<CreditLimitHistory>
{
    public void Configure(EntityTypeBuilder<AccountReceivable> b)
    {
        b.ToTable("accounts_receivable", "receivables"); b.Audit(); b.HasIndex(x => x.SaleId).IsUnique();
        b.Property(x => x.Total).HasPrecision(18, 2); b.Property(x => x.Balance).HasPrecision(18, 2);
        b.HasMany(x => x.Allocations).WithOne().HasForeignKey(x => x.AccountReceivableId); b.Navigation(x => x.Allocations).AutoInclude();
    }
    public void Configure(EntityTypeBuilder<CustomerPayment> b)
    {
        b.ToTable("customer_payments", "receivables", t => t.HasCheckConstraint("CK_customer_payments_positive", "\"Amount\" > 0")); b.Audit(); b.Property(x => x.Amount).HasPrecision(18, 2);
        b.HasMany(x => x.Allocations).WithOne().HasForeignKey(x => x.CustomerPaymentId); b.Navigation(x => x.Allocations).AutoInclude();
        b.HasIndex(x => new { x.Method, x.Reference }).IsUnique();
        b.Ignore(x => x.AvailableAmount);
    }
    public void Configure(EntityTypeBuilder<PaymentAllocation> b) { b.ToTable("payment_allocations", "receivables", t => t.HasCheckConstraint("CK_payment_allocations_positive", "\"AmountApplied\" > 0")); b.Entity(); b.Property(x => x.AmountApplied).HasPrecision(18, 2); }
    public void Configure(EntityTypeBuilder<CreditLimitHistory> b) { b.ToTable("credit_limit_history", "receivables"); b.Entity(); b.Property(x => x.PreviousLimit).HasPrecision(18, 2); b.Property(x => x.NewLimit).HasPrecision(18, 2); }
}

public sealed class AuditConfiguration :
    IEntityTypeConfiguration<AuditLog>, IEntityTypeConfiguration<CancellationReason>, IEntityTypeConfiguration<OperationalNote>,
    IEntityTypeConfiguration<UserActivityLog>, IEntityTypeConfiguration<SystemErrorLog>,
    IEntityTypeConfiguration<SystemEventLog>, IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<AuditLog> b)
    {
        b.ToTable("audit_logs", "audit"); b.Entity();
        b.Property(x => x.BeforeData).HasColumnType("jsonb"); b.Property(x => x.AfterData).HasColumnType("jsonb"); b.Property(x => x.ChangedProperties).HasColumnType("jsonb");
        b.HasIndex(x => new { x.EntityName, x.EntityId, x.OccurredAt }); b.HasIndex(x => new { x.UserId, x.OccurredAt });
        b.HasIndex(x => x.CorrelationId); b.HasIndex(x => x.OperationId); b.HasIndex(x => x.TransactionId); b.HasIndex(x => x.ReferenceFolio);
    }
    public void Configure(EntityTypeBuilder<UserActivityLog> b) => LogModelConfiguration.ConfigureUserActivity(b);
    public void Configure(EntityTypeBuilder<SystemErrorLog> b) => LogModelConfiguration.ConfigureSystemError(b);
    public void Configure(EntityTypeBuilder<CancellationReason> b) { b.ToTable("cancellation_reasons", "audit"); b.Audit(); b.HasIndex(x => new { x.Module, x.Code }).IsUnique(); }
    public void Configure(EntityTypeBuilder<OperationalNote> b) { b.ToTable("operational_notes", "audit"); b.Entity(); b.HasIndex(x => new { x.EntityName, x.EntityId }); }
    public void Configure(EntityTypeBuilder<SystemEventLog> b) => LogModelConfiguration.ConfigureSystemEvent(b);
    public void Configure(EntityTypeBuilder<OutboxMessage> b) { b.ToTable("outbox_messages", "audit"); b.Entity(); b.Property(x => x.Payload).HasColumnType("jsonb"); b.HasIndex(x => x.EventId).IsUnique(); b.HasIndex(x => x.OperationId); b.HasIndex(x => x.CorrelationId); b.HasIndex(x => new { x.ProcessedAt, x.OccurredAt }); }
}

public sealed class AdministrationConfiguration :
    IEntityTypeConfiguration<SystemSetting>, IEntityTypeConfiguration<FolioSequence>, IEntityTypeConfiguration<PaymentMethod>,
    IEntityTypeConfiguration<CreditPolicy>, IEntityTypeConfiguration<InventoryPolicy>
{
    public void Configure(EntityTypeBuilder<SystemSetting> b) { b.ToTable("system_settings", "admin"); b.Audit(); b.Property(x => x.Key).HasMaxLength(150); b.HasIndex(x => x.Key).IsUnique(); }
    public void Configure(EntityTypeBuilder<FolioSequence> b) { b.ToTable("folio_sequences", "admin"); b.Audit(); b.Property(x => x.DocumentType).HasMaxLength(50); b.HasIndex(x => x.DocumentType).IsUnique(); }
    public void Configure(EntityTypeBuilder<PaymentMethod> b) { b.ToTable("payment_methods", "admin"); b.Audit(); b.Property(x => x.Code).HasMaxLength(50); b.HasIndex(x => x.Code).IsUnique(); }
    public void Configure(EntityTypeBuilder<CreditPolicy> b) { b.ToTable("credit_policies", "admin"); b.Audit(); }
    public void Configure(EntityTypeBuilder<InventoryPolicy> b) { b.ToTable("inventory_policies", "admin"); b.Audit(); }
}
