using Distribuidora.Contracts.Requests;
using Distribuidora.Domain.Catalogs;
using Distribuidora.Domain.Common;
using Distribuidora.Domain.Inventory;
using Distribuidora.Domain.Sales;
using Distribuidora.Domain.Security;
using Distribuidora.Infrastructure.Observability;
using Distribuidora.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Distribuidora.IntegrationTests;

public sealed class LocalPostgresFactAttribute : FactAttribute
{
    public LocalPostgresFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("POS_TEST_ADMIN_CONNECTION")))
            Skip = "Set POS_TEST_ADMIN_CONNECTION to a local PostgreSQL connection; tests create an isolated database.";
    }
}

public sealed class PosProductPostgresTests
{
    [LocalPostgresFact]
    public async Task Migration_search_ranking_stock_favorites_and_pagination_work_in_PostgreSQL()
    {
        var admin = new NpgsqlConnectionStringBuilder(Environment.GetEnvironmentVariable("POS_TEST_ADMIN_CONNECTION"));
        Assert.Contains(admin.Host, new[] { "localhost", "127.0.0.1", "::1" });
        var database = "pos_test_" + Guid.NewGuid().ToString("N");
        admin.Database = "postgres";
        await using var connection = new NpgsqlConnection(admin.ConnectionString);
        await connection.OpenAsync();
        await using (var command = new NpgsqlCommand($"CREATE DATABASE {database}", connection)) await command.ExecuteNonQueryAsync();
        try
        {
            var target = new NpgsqlConnectionStringBuilder(admin.ConnectionString) { Database = database, Pooling = false };
            await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(target.ConnectionString).Options,
                new RequestTraceContext(), new SensitiveDataSanitizer(), new DatatimeProvider(), new OutboxWakeSignal());
            await db.Database.MigrateAsync();
            var user = new User { Username = "pos-test", Name = "Cashier", Email = "pos@example.invalid", PasswordHash = "test" };
            var category = new Category { Name = "Bebidas" };
            var brand = new Brand { Name = "Coca-Cola" };
            var unit = new Unit { Name = "Pieza", Abbreviation = "PZA" };
            var warehouse = new Warehouse { Name = "Counter" };
            var otherWarehouse = new Warehouse { Name = "Other" };
            db.AddRange(user, category, brand, unit, warehouse, otherWarehouse);
            var products = Enumerable.Range(0, 125).Select(i => new Product {
                Name = $"Producto {i:000}", Sku = $"SKU-{i:000}", Barcode = $"750000000{i:0000}",
                CategoryId = category.Id, BrandId = brand.Id, UnitId = unit.Id,
                BasePrice = 18, MinimumStock = 5,
            }).ToArray();
            var coca = products[^1];
            coca.Name = "Coca-Cola 600 ml";
            coca.Aliases.Add(new ProductAlias { Alias = "coca 60ml" });
            products[0].Name = "Arroz premium";
            products[0].Aliases.Add(new ProductAlias { Alias = "arz" });
            db.AddRange(products);
            await db.SaveChangesAsync();
            var stock = new StockBalance { ProductId = coca.Id, WarehouseId = warehouse.Id };
            stock.Apply(4, false, DateTimeOffset.UtcNow);
            db.Add(stock);
            db.Add(new InventoryMovement { ProductId = coca.Id, DestinationWarehouseId = warehouse.Id,
                Quantity = 4, ResultingBalance = 4, MovementType = MovementType.PurchaseReceipt,
                Date = DateTimeOffset.UtcNow, Folio = "TEST-RECEIPT", ReferenceType = "TestReceipt", ReferenceId = Guid.NewGuid() });
            var sale = new CounterSale { Folio = "TEST-SALE", SourceWarehouseId = warehouse.Id,
                SaleDate = DateTimeOffset.UtcNow, Items = [new CounterSaleItem { ProductId = coca.Id, Quantity = 1, UnitPrice = 0 }] };
            sale.Confirm(DateTimeOffset.UtcNow);
            db.Add(sale);
            await db.SaveChangesAsync();
            var store = new PosProductStore(db, new DatatimeProvider());
            var query = new PosProductSearchRequest { WarehouseId = warehouse.Id };
            var page = await store.SearchAsync(query, user.Id, default);
            Assert.Equal(125, page.Total);
            Assert.Equal(30, page.Items.Count);
            Assert.Equal(coca.Id, page.Items.First().Id);
            query.Page = 2;
            var secondPage = await store.SearchAsync(query, user.Id, default);
            Assert.Empty(page.Items.Select(x => x.Id).Intersect(secondPage.Items.Select(x => x.Id)));
            query.Page = 1;
            query.Search = "coca 600";
            Assert.Equal(coca.Id, (await store.SearchAsync(query, user.Id, default)).Items.Single().Id);
            query.Search = "cocaa";
            Assert.Contains((await store.SearchAsync(query, user.Id, default)).Items, x => x.Id == coca.Id);
            query.Search = "arz";
            Assert.Contains((await store.SearchAsync(query, user.Id, default)).Items, x => x.Id == products[0].Id);
            query.Search = coca.Barcode; query.ExactBarcode = true;
            var exact = (await store.SearchAsync(query, user.Id, default)).Items.Single();
            Assert.Equal(4, exact.AvailableStock);
            Assert.Equal(1, exact.SoldQuantity);
            query.Search = coca.Barcode![..^1];
            Assert.Empty((await store.SearchAsync(query, user.Id, default)).Items);
            query.Search = null; query.ExactBarcode = false; query.InStockOnly = true; query.LowStockOnly = true;
            Assert.Single((await store.SearchAsync(query, user.Id, default)).Items);
            query.WarehouseId = otherWarehouse.Id;
            Assert.Empty((await store.SearchAsync(query, user.Id, default)).Items);
            query.WarehouseId = warehouse.Id; query.InStockOnly = false; query.LowStockOnly = false;
            await store.SetFavoriteAsync(coca.Id, user.Id, true, default);
            await store.SetFavoriteAsync(coca.Id, user.Id, true, default);
            query.FavoritesOnly = true;
            Assert.Single((await store.SearchAsync(query, user.Id, default)).Items);
            Assert.Empty((await store.SearchAsync(query, Guid.NewGuid(), default)).Items);
            await store.SetFavoriteAsync(coca.Id, user.Id, false, default);
            Assert.Empty((await store.SearchAsync(query, user.Id, default)).Items);
            var facets = await store.FacetsAsync(new PosFacetRequest { Kind = "category", Search = "beb" }, default);
            Assert.Equal(category.Id, facets.Items.Single().Id);
            Assert.Equal(4, (await db.Set<StockBalance>().SingleAsync()).Quantity);
        }
        finally
        {
            // Only the random database created by this test is removed.
            Assert.StartsWith("pos_test_", database);
            await using var command = new NpgsqlCommand($"DROP DATABASE {database} WITH (FORCE)", connection);
            await command.ExecuteNonQueryAsync();
        }
    }
}
