using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Specifications;
using Distribuidora.Domain.AccountsReceivable;
using Distribuidora.Domain.Common;
using Distribuidora.Contracts.Responses;
using Domain = Distribuidora.Domain;

namespace Distribuidora.Application.Features.Reports;

public sealed class ReportService(IAppDbContext db)
{
    private const int MaximumReportRangeDays = 366;
    private const int FirstAgingBucketDays = 30;
    private const int SecondAgingBucketDays = 60;
    private const int ThirdAgingBucketDays = 90;

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
            open.Where(x => x.DueDate < asOf && x.DueDate >= asOf.AddDays(-FirstAgingBucketDays)).Sum(x => x.Balance),
            open.Where(x => x.DueDate < asOf.AddDays(-FirstAgingBucketDays) && x.DueDate >= asOf.AddDays(-SecondAgingBucketDays)).Sum(x => x.Balance),
            open.Where(x => x.DueDate < asOf.AddDays(-SecondAgingBucketDays) && x.DueDate >= asOf.AddDays(-ThirdAgingBucketDays)).Sum(x => x.Balance),
            open.Where(x => x.DueDate < asOf.AddDays(-ThirdAgingBucketDays)).Sum(x => x.Balance));
    }

    public DashboardResponse Dashboard(DateTimeOffset now)
    {
        var start = new DateTimeOffset(now.Year, now.Month, now.Day, 0, 0, 0, now.Offset);
        var trendStart = start.AddDays(-6);
        var sales = db.Query(Specification.Create<Domain.Sales.CounterSale>(
                x => x.SaleDate >= trendStart && x.Status == DocumentStatus.Confirmed))
            .ToArray();
        var todaySales = sales.Where(x => x.SaleDate >= start).ToArray();
        var balances = db.Query(Specification.All<Domain.Inventory.StockBalance>()).ToArray();
        var lowStock = LowStock();
        var outOfStockProductIds = lowStock
            .Where(x => x.Quantity <= 0)
            .Select(x => x.ProductId)
            .Distinct()
            .ToHashSet();
        var lowStockProductIds = lowStock.Select(x => x.ProductId).Distinct().ToHashSet();
        var activeProductCount = db.Query(Specification.Create<Domain.Catalogs.Product>(x => x.Active)).Count();
        var salesTrend = Enumerable.Range(0, 7)
            .Select(offset => trendStart.AddDays(offset))
            .Select(day =>
            {
                var nextDay = day.AddDays(1);
                var daySales = sales.Where(x => x.SaleDate >= day && x.SaleDate < nextDay).ToArray();
                return new DashboardSalesDayResponse(
                    DateOnly.FromDateTime(day.Date),
                    daySales.Sum(x => x.Total),
                    daySales.Length);
            })
            .ToArray();
        var aging = ReceivablesAging(now);
        return new(
            todaySales.Sum(x => x.Total),
            todaySales.Length,
            balances.Sum(x => x.Quantity),
            lowStockProductIds.Count,
            db.Query(Specification.Create<AccountReceivable>(
                x => x.Status != ReceivableStatus.Paid && x.Status != ReceivableStatus.Cancelled)).Sum(x => x.Balance),
            salesTrend,
            new DashboardInventoryHealthResponse(
                Math.Max(0, activeProductCount - lowStockProductIds.Count),
                Math.Max(0, lowStockProductIds.Count - outOfStockProductIds.Count),
                outOfStockProductIds.Count,
                balances.Sum(x => Math.Max(0, x.Quantity - x.ReservedQuantity)),
                balances.Sum(x => x.ReservedQuantity)),
            aging);
    }

    private static void ValidateRange(DateTimeOffset from, DateTimeOffset to)
    {
        if (from > to) throw new ArgumentException("From date must be before to date.");
        if (to - from > TimeSpan.FromDays(MaximumReportRangeDays))
            throw new ArgumentException($"Report range cannot exceed {MaximumReportRangeDays} days.");
    }
}
