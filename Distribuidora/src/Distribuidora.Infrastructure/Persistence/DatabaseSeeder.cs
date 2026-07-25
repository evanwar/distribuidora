using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Specifications;
using Distribuidora.Domain.Administration;
using Distribuidora.Domain.Audits;
using Distribuidora.Domain.Catalogs;
using Distribuidora.Domain.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Distribuidora.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    private static readonly string[] PermissionKeys =
    [
        "security.view", "security.create_user", "security.edit_user", "security.manage_roles",
        "catalogs.view", "catalogs.create", "catalogs.edit", "catalogs.deactivate",
        "inventory.view", "inventory.adjust", "inventory.transfer", "inventory.cancel_adjustment",
        "purchases.view", "purchases.create", "purchases.confirm", "purchases.cancel", "goods_receipts.close",
        "sales.view", "sales.create", "sales.edit_draft", "sales.confirm", "sales.register_payment", "sales.cancel",
        "receivables.view", "receivables.register_payment", "receivables.apply_payment", "receivables.cancel_payment", "receivables.change_credit_limit",
        "audit.view", "audit.export", "admin.manage_cancellation_reasons",
        "logs.activity.read", "logs.audit.read", "logs.errors.read", "logs.errors.resolve", "logs.events.read", "logs.trace.read", "logs.export",
        "reports.view", "reports.financial", "reports.inventory",
        "admin.view", "admin.configure", "admin.manage_folios", "admin.manage_payment_methods"
    ];

    public static async Task SeedAsync(AppDbContext db, IPasswordService passwords, IConfiguration configuration, CancellationToken ct = default)
    {
        await db.Database.MigrateAsync(ct);
        var existingPermissionKeys = (await db.Query(Specification.All<Permission>())
            .Select(x => x.Key).ToArrayAsync(ct)).ToHashSet();
        foreach (var key in PermissionKeys.Where(x => !existingPermissionKeys.Contains(x)))
        {
            var parts = key.Split('.', 2);
            db.Add(new Permission { Key = key, Module = parts[0], Action = parts[1], Description = key });
        }
        await db.SaveChangesAsync(ct);

        var adminRole = await db.Query(Specification.Create<Role>(x => x.Name == "Administrator"))
            .Include(x => x.Permissions).SingleOrDefaultAsync(ct);
        if (adminRole is null)
        {
            adminRole = new Role { Name = "Administrator", Description = "Full system access" };
            db.Add(adminRole);
        }
        var assigned = adminRole.Permissions.Select(x => x.Key).ToHashSet();
        foreach (var permission in await db.Query(
                     Specification.Create<Permission>(x => !assigned.Contains(x.Key))).ToListAsync(ct))
            adminRole.Permissions.Add(permission);

        if (!await db.Query(Specification.All<User>()).AnyAsync(ct))
        {
            var admin = new User
            {
                Name = "System Administrator",
                Username = configuration["Seed:AdminUsername"] ?? "admin",
                Email = configuration["Seed:AdminEmail"] ?? "admin@local.test",
                PasswordHash = passwords.Hash(configuration["Seed:AdminPassword"] ?? "ChangeMe123!")
            };
            admin.Roles.Add(adminRole);
            db.Add(admin);
        }

        if (!await db.Query(Specification.All<Warehouse>()).AnyAsync(ct))
            db.Add(new Warehouse { Name = "Main Warehouse", Type = WarehouseType.Central });
        if (!await db.Query(Specification.All<PaymentMethod>()).AnyAsync(ct))
            db.AddRange(
                new PaymentMethod { Code = "cash", Name = "Cash" },
                new PaymentMethod { Code = "card", Name = "Card", RequiresReference = true },
                new PaymentMethod { Code = "transfer", Name = "Bank Transfer", RequiresReference = true });
        if (!await db.Query(Specification.All<CreditPolicy>()).AnyAsync(ct)) db.Add(new CreditPolicy());
        if (!await db.Query(Specification.All<InventoryPolicy>()).AnyAsync(ct)) db.Add(new InventoryPolicy());
        if (!await db.Query(Specification.All<CancellationReason>()).AnyAsync(ct))
            db.Add(new CancellationReason { Code = "CAPTURE_ERROR", Description = "Capture error", Module = "all" });
        if (!await db.Query(Specification.All<FolioSequence>()).AnyAsync(ct))
            db.AddRange(
                Sequence("purchase", "PO-"), Sequence("goods_receipt", "GR-"),
                Sequence("inventory_adjustment", "ADJ-"), Sequence("counter_sale", "CS-"));
        await db.SaveChangesAsync(ct);
    }

    private static FolioSequence Sequence(string type, string prefix) => new() { DocumentType = type, Prefix = prefix, Padding = 8 };
}
