namespace Distribuidora.Contracts.Responses;

public sealed record SalesSummaryResponse(int Count, decimal Subtotal, decimal Discounts, decimal Taxes, decimal Total, decimal Paid, decimal Balance);
public sealed record SalesByProductResponse(Guid ProductId, decimal Quantity, decimal Revenue);
public sealed record GrossProfitResponse(decimal Revenue, decimal HistoricalCost, decimal GrossProfit);
public sealed record InventorySummaryResponse(Guid WarehouseId, Guid ProductId, string Sku, string Name, decimal Quantity, decimal ReservedQuantity, decimal InventoryValue);
public sealed record PurchasesSummaryResponse(int Count, decimal Subtotal, decimal Tax, decimal Total);
public sealed record ReceivablesAgingResponse(decimal Current, decimal Days1To30, decimal Days31To60, decimal Days61To90, decimal Over90);
public sealed record DashboardSalesDayResponse(DateOnly Date, decimal Sales, int Transactions);
public sealed record DashboardInventoryHealthResponse(int HealthyProducts, int LowStockProducts, int OutOfStockProducts, decimal AvailableUnits, decimal ReservedUnits);
public sealed record DashboardResponse(
    decimal TodaySales,
    int TodayTransactions,
    decimal InventoryUnits,
    int LowStockProducts,
    decimal Receivables,
    IReadOnlyCollection<DashboardSalesDayResponse> SalesTrend,
    DashboardInventoryHealthResponse InventoryHealth,
    ReceivablesAgingResponse ReceivablesAging);
