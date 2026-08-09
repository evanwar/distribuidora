using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Specifications;
using Distribuidora.Application.Security;
using Distribuidora.Domain.Administration;
using Distribuidora.Domain.Audits;
using Distribuidora.Domain.Catalogs;
using Distribuidora.Domain.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Distribuidora.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    private const string ExampleAdminPassword = "replace-with-a-strong-unique-password";

    public static async Task SeedAsync(AppDbContext db, IPasswordService passwords, IConfiguration configuration, CancellationToken ct = default)
    {
        await db.Database.MigrateAsync(ct);
        var existingPermissionKeys = (await db.Query(Specification.All<Permission>())
            .Select(x => x.Key).ToArrayAsync(ct)).ToHashSet();
        foreach (var key in Permissions.All.Where(x => !existingPermissionKeys.Contains(x)))
        {
            var parts = key.Split('.', 2);
            db.Add(new Permission { Key = key, Module = parts[0], Action = parts[1], Description = key });
        }
        await db.SaveChangesAsync(ct);

        var adminRole = await db.Query(Specification.Create<Role>(x => x.Name == SecurityRoleNames.Administrator))
            .Include(x => x.Permissions).SingleOrDefaultAsync(ct);
        if (adminRole is null)
        {
            adminRole = new Role { Name = SecurityRoleNames.Administrator, Description = "Full system access" };
            db.Add(adminRole);
        }
        var assigned = adminRole.Permissions.Select(x => x.Key).ToHashSet();
        foreach (var permission in await db.Query(
                     Specification.Create<Permission>(x => !assigned.Contains(x.Key))).ToListAsync(ct))
            adminRole.Permissions.Add(permission);

        var adminUsername = configuration["Seed:AdminUsername"] ?? "admin";
        var adminEmail = configuration["Seed:AdminEmail"] ?? "admin@local.test";
        var adminPassword = configuration["Seed:AdminPassword"];
        if (string.IsNullOrWhiteSpace(adminPassword) ||
            adminPassword is "ChangeMe123!" or ExampleAdminPassword)
            throw new InvalidOperationException("Seed:AdminPassword must be explicitly configured with a non-default secret.");
        var syncAdminCredentials = configuration.GetValue("Seed:SyncAdminCredentials", false);
        var admin = await db.Query(Specification.Create<User>(x => x.Username == adminUsername))
            .Include(x => x.Roles)
            .SingleOrDefaultAsync(ct);
        if (admin is null)
        {
            admin = new User
            {
                Name = "System Administrator",
                Username = adminUsername,
                Email = adminEmail,
                PasswordHash = passwords.Hash(adminPassword)
            };
            admin.Roles.Add(adminRole);
            db.Add(admin);
        }
        else if (syncAdminCredentials)
        {
            // En Docker el .env es la fuente autoritativa de la cuenta semilla.
            // Esto permite rotar la credencial aun cuando PostgreSQL usa un volumen persistente.
            admin.Email = adminEmail;
            admin.PasswordHash = passwords.Hash(adminPassword);
            admin.Active = true;
            if (admin.Roles.All(x => x.Id != adminRole.Id)) admin.Roles.Add(adminRole);
        }

        if (!await db.Query(Specification.All<Warehouse>()).AnyAsync(ct))
            db.Add(new Warehouse { Name = "Main Warehouse", Type = WarehouseType.Central });
        if (!await db.Query(Specification.All<PaymentMethod>()).AnyAsync(ct))
            db.AddRange(
                new PaymentMethod { Code = PaymentMethodCodes.Cash, Name = "Cash" },
                new PaymentMethod { Code = PaymentMethodCodes.Card, Name = "Card", RequiresReference = true },
                new PaymentMethod { Code = PaymentMethodCodes.BankTransfer, Name = "Bank Transfer", RequiresReference = true });
        if (!await db.Query(Specification.All<PaymentTerminal>()).AnyAsync(ct))
        {
            var legacyTerminalId = configuration["MercadoPago:Point:TerminalId"];
            if (!string.IsNullOrWhiteSpace(legacyTerminalId))
                db.Add(new PaymentTerminal
                {
                    Name = "Mercado Pago Point",
                    ExternalId = legacyTerminalId.Trim(),
                    Provider = PaymentTerminalProviders.MercadoPago,
                    IsDefault = true
                });
        }
        if (!await db.Query(Specification.All<CreditPolicy>()).AnyAsync(ct)) db.Add(new CreditPolicy());
        if (!await db.Query(Specification.All<InventoryPolicy>()).AnyAsync(ct)) db.Add(new InventoryPolicy());
        if (!await db.Query(Specification.All<CancellationReason>()).AnyAsync(ct))
            db.Add(new CancellationReason { Code = "CAPTURE_ERROR", Description = "Capture error", Module = "all" });
        if (!await db.Query(Specification.All<FolioSequence>()).AnyAsync(ct))
            db.AddRange(
                Sequence(DocumentFolioTypes.Purchase, DocumentFolioTypes.PurchasePrefix),
                Sequence(DocumentFolioTypes.GoodsReceipt, DocumentFolioTypes.GoodsReceiptPrefix),
                Sequence(DocumentFolioTypes.InventoryAdjustment, DocumentFolioTypes.InventoryAdjustmentPrefix),
                Sequence(DocumentFolioTypes.CounterSale, DocumentFolioTypes.CounterSalePrefix));
        await db.SaveChangesAsync(ct);
    }

    private static FolioSequence Sequence(string type, string prefix) =>
        new()
        {
            DocumentType = type,
            Prefix = prefix,
            Padding = DocumentFolioTypes.DefaultPadding
        };
}
