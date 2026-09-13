using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Features.Products.PosProducts;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Distribuidora.Domain.Catalogs;
using Distribuidora.Domain.Common;
using Distribuidora.Domain.Inventory;
using Distribuidora.Domain.Sales;
using Microsoft.EntityFrameworkCore;

namespace Distribuidora.Infrastructure.Persistence;

public sealed class PosProductStore(AppDbContext db, IDatatimeProvider clock) : IPosProductStore
{
    public async Task<PagedResponse<PosProductResponse>> SearchAsync(PosProductSearchRequest request, Guid userId, CancellationToken ct)
    {
        if (!await db.Set<Warehouse>().AnyAsync(x => x.Id == request.WarehouseId && x.Active && !x.IsDeleted, ct))
            throw new NotFoundException("Warehouse not found.");

        var text = request.Search?.Trim().ToLowerInvariant() ?? "";
        var since = clock.UtcNow.AddDays(-30);
        var sold = from item in db.Set<CounterSaleItem>()
                   join sale in db.Set<CounterSale>() on item.SaleId equals sale.Id
                   where !sale.IsDeleted && sale.Status == DocumentStatus.Confirmed && sale.SaleDate >= since
                       && sale.SourceWarehouseId == request.WarehouseId
                   group item by item.ProductId into sales
                   select new { ProductId = sales.Key, Quantity = (decimal?)sales.Sum(x => x.Quantity) };

        var products = db.Set<Product>().AsNoTracking().Where(x => x.Active && !x.IsDeleted);
        if (request.ExactBarcode)
            products = products.Where(x => x.Barcode == request.Search!.Trim());
        else
        {
            // Require every token, allowing aliases and typo matches without downloading the catalog.
            foreach (var token in text.Split(' ', StringSplitOptions.RemoveEmptyEntries).Distinct())
                products = products.Where(x => x.Name.ToLower().Contains(token) || x.Sku.ToLower().Contains(token)
                    || (x.Barcode != null && x.Barcode.Contains(token))
                    || x.Aliases.Any(a => a.Active && !a.IsDeleted && a.Alias.ToLower().Contains(token))
                    || db.Set<Category>().Any(c => c.Id == x.CategoryId && c.Active && !c.IsDeleted && c.Name.ToLower().Contains(token))
                    || db.Set<Brand>().Any(b => b.Id == x.BrandId && b.Active && !b.IsDeleted && b.Name.ToLower().Contains(token))
                    || (token.Length >= 3 && EF.Functions.TrigramsAreNotWordSimilar(x.Name.ToLower(), token)));
        }
        if (request.CategoryId.HasValue) products = products.Where(x => x.CategoryId == request.CategoryId);
        if (request.BrandId.HasValue) products = products.Where(x => x.BrandId == request.BrandId);
        if (request.MinimumPrice.HasValue) products = products.Where(x => x.BasePrice >= request.MinimumPrice);
        if (request.MaximumPrice.HasValue) products = products.Where(x => x.BasePrice <= request.MaximumPrice);
        if (request.ProductIds is not null) products = products.Where(x => request.ProductIds.Contains(x.Id));

        var query = from product in products
                    join category in db.Set<Category>() on product.CategoryId equals category.Id
                    join brand in db.Set<Brand>() on product.BrandId equals brand.Id
                    join balance in db.Set<StockBalance>().Where(x => x.WarehouseId == request.WarehouseId && !x.IsDeleted)
                        on product.Id equals balance.ProductId into balances
                    from balance in balances.DefaultIfEmpty()
                    join sale in sold on product.Id equals sale.ProductId into sales
                    from sale in sales.DefaultIfEmpty()
                    select new
                    {
                        product.Id, product.Name, product.Sku, product.Barcode, Price = product.BasePrice,
                        Available = balance == null ? 0 : balance.Quantity - balance.ReservedQuantity,
                        product.MinimumStock, product.CategoryId, CategoryName = category.Name,
                        product.BrandId, BrandName = brand.Name,
                        Favorite = db.Set<ProductFavorite>().Any(f => f.UserId == userId && f.ProductId == product.Id),
                        Sold = sale.Quantity ?? 0
                    };
        if (request.InStockOnly) query = query.Where(x => x.Available > 0);
        if (request.LowStockOnly) query = query.Where(x => x.Available <= x.MinimumStock);
        if (request.FavoritesOnly) query = query.Where(x => x.Favorite);
        if (request.BestSellersOnly) query = query.Where(x => x.Sold > 0);
        var total = await query.CountAsync(ct);
        var items = await query.OrderBy(x => text != "" && x.Barcode == text ? 0
                : text != "" && x.Sku.ToLower() == text ? 1 : text != "" && x.Name.ToLower() == text ? 2 : 3)
            .ThenByDescending(x => x.Sold)
            .ThenBy(x => x.Name.ToLower().StartsWith(text) ? 0 : x.Name.ToLower().Contains(text) ? 1 : 2)
            .ThenBy(x => x.Name).ThenBy(x => x.Id)
            .Skip((request.Page - 1) * request.PageSize).Take(request.PageSize)
            .Select(x => new PosProductResponse(x.Id, x.Name, x.Sku, x.Barcode, x.Price,
                Math.Max(0, x.Available), x.MinimumStock, x.CategoryId, x.CategoryName,
                x.BrandId, x.BrandName, x.Favorite, x.Sold)).ToArrayAsync(ct);
        return new(items, request.Page, request.PageSize, total);
    }

    public async Task<PagedResponse<PosFacetResponse>> FacetsAsync(PosFacetRequest request, CancellationToken ct)
    {
        var text = request.Search?.Trim().ToLowerInvariant() ?? "";
        var query = request.Kind == "category"
            ? db.Set<Category>().Where(x => x.Active && !x.IsDeleted && x.Name.ToLower().Contains(text)).Select(x => new { x.Id, x.Name })
            : db.Set<Brand>().Where(x => x.Active && !x.IsDeleted && x.Name.ToLower().Contains(text)).Select(x => new { x.Id, x.Name });
        var total = await query.CountAsync(ct);
        var items = await query.OrderBy(x => x.Name).ThenBy(x => x.Id).Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize).Select(x => new PosFacetResponse(x.Id, x.Name)).ToArrayAsync(ct);
        return new(items, request.Page, request.PageSize, total);
    }

    public async Task SetFavoriteAsync(Guid productId, Guid userId, bool favorite, CancellationToken ct)
    {
        if (!await db.Set<Product>().AnyAsync(x => x.Id == productId && x.Active && !x.IsDeleted, ct))
            throw new NotFoundException("Product not found.");
        // Idempotent insert also handles concurrent requests from multiple tabs.
        if (favorite)
            await db.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO catalogs.product_favorites (\"UserId\", \"ProductId\") VALUES ({userId}, {productId}) ON CONFLICT DO NOTHING", ct);
        else
            await db.Set<ProductFavorite>().Where(x => x.UserId == userId && x.ProductId == productId).ExecuteDeleteAsync(ct);
    }
}
