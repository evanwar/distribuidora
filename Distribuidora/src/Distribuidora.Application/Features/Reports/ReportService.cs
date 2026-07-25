using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Specifications;
using Distribuidora.Domain.AccountsReceivable;
using Distribuidora.Domain.Common;
using Distribuidora.Contracts.Responses;
using Domain = Distribuidora.Domain;

namespace Distribuidora.Application.Features.Reports;

public sealed class ReportService(IAppDbContext db)
{
    public SalesSummaryResponse SalesSummary(DateTimeOffset from, DateTimeOffset to)
    {
        ValidateRange(from, to);
        var sales = db.Query(Specification.Create<Domain.Sales.CounterSale>(
            x => x.SaleDate >= from && x.SaleDate <= to && x.Status == DocumentStatus.Confirmed));
        return new(sales.Count(), sales.Sum(x => x.Subtotal), sales.Sum(x => x.DiscountTotal), sales.Sum(x => x.TaxTotal), sales.Sum(x => x.Total), sales.Sum(x => x.PaidAmount), sales.Sum(x => x.Balance));
    }

    public IReadOnlyCollection<SalesByProductResponse> SalesByProduct(DateTimeOffset start, DateTimeOffset end)
    {
        ValidateRange(start, end);
        var sales = db.Query(Specification.Create<Domain.Sales.CounterSale>(
            s => s.SaleDate >= start && s.SaleDate <= end && s.Status == DocumentStatus.Confirmed));
        return (
            from s in sales
            from i in s.Items
            group i by i.ProductId into g
            select new SalesByProductResponse(g.Key, g.Sum(x => x.Quantity), g.Sum(x => x.Quantity * x.UnitPrice - x.Discount)))
            .ToArray();
    }

    public GrossProfitResponse GrossProfit(DateTimeOffset from, DateTimeOffset to)
    {
        ValidateRange(from, to);
        var lines = db.Query(Specification.Create<Domain.Sales.CounterSale>(
                x => x.SaleDate >= from && x.SaleDate <= to && x.Status == DocumentStatus.Confirmed))
            .SelectMany(x => x.Items);
        var revenue = lines.Sum(x => x.Quantity * x.UnitPrice - x.Discount);
        var cost = lines.Sum(x => x.Quantity * x.HistoricalUnitCost);
        return new(revenue, cost, revenue - cost);
    }

    public IReadOnlyCollection<InventorySummaryResponse> InventorySummary() =>
        (
            from b in db.Query(Specification.All<Domain.Inventory.StockBalance>())
            join p in db.Query(Specification.All<Domain.Catalogs.Product>()) on b.ProductId equals p.Id
            select new InventorySummaryResponse(b.WarehouseId, b.ProductId, p.Sku, p.Name, b.Quantity, b.ReservedQuantity, b.Quantity * p.Cost))
            .ToArray();

    public IReadOnlyCollection<LowStockResponse> LowStock() =>
        (
            from p in db.Query(Specification.Create<Domain.Catalogs.Product>(x => x.Active))
            join b in db.Query(Specification.All<Domain.Inventory.StockBalance>()) on p.Id equals b.ProductId into balances
            from b in balances.DefaultIfEmpty()
            let quantity = b == null ? 0 : b.Quantity
            where quantity <= p.MinimumStock
            select new LowStockResponse(p.Id, p.Sku, p.Name, p.MinimumStock, quantity, b == null ? null : b.WarehouseId))
            .ToArray();

    public PurchasesSummaryResponse PurchasesSummary(DateTimeOffset from, DateTimeOffset to)
    {
        ValidateRange(from, to);
        var purchases = db.Query(Specification.Create<Domain.Purchases.PurchaseOrder>(
            x => x.Date >= from && x.Date <= to && x.Status != DocumentStatus.Cancelled));
        return new(purchases.Count(), purchases.Sum(x => x.Subtotal), purchases.Sum(x => x.Tax), purchases.Sum(x => x.Total));
    }

    public ReceivablesAgingResponse ReceivablesAging(DateTimeOffset asOf)
    {
        var open = db.Query(Specification.Create<AccountReceivable>(
            x => x.Status != ReceivableStatus.Paid && x.Status != ReceivableStatus.Cancelled));
        return new(
            open.Where(x => x.DueDate >= asOf).Sum(x => x.Balance),
            open.Where(x => x.DueDate < asOf && x.DueDate >= asOf.AddDays(-30)).Sum(x => x.Balance),
            open.Where(x => x.DueDate < asOf.AddDays(-30) && x.DueDate >= asOf.AddDays(-60)).Sum(x => x.Balance),
            open.Where(x => x.DueDate < asOf.AddDays(-60) && x.DueDate >= asOf.AddDays(-90)).Sum(x => x.Balance),
            open.Where(x => x.DueDate < asOf.AddDays(-90)).Sum(x => x.Balance));
    }

    public DashboardResponse Dashboard(DateTimeOffset now)
    {
        var start = new DateTimeOffset(now.Year, now.Month, now.Day, 0, 0, 0, now.Offset);
        var sales = db.Query(Specification.Create<Domain.Sales.CounterSale>(
            x => x.SaleDate >= start && x.Status == DocumentStatus.Confirmed));
        return new(
            sales.Sum(x => x.Total),
            sales.Count(),
            db.Query(Specification.All<Domain.Inventory.StockBalance>()).Sum(x => x.Quantity),
            LowStock().Count,
            db.Query(Specification.Create<AccountReceivable>(
                x => x.Status != ReceivableStatus.Paid && x.Status != ReceivableStatus.Cancelled)).Sum(x => x.Balance));
    }

    private static void ValidateRange(DateTimeOffset from, DateTimeOffset to)
    {
        if (from > to) throw new ArgumentException("From date must be before to date.");
        if (to - from > TimeSpan.FromDays(366)) throw new ArgumentException("Report range cannot exceed 366 days.");
    }
}
