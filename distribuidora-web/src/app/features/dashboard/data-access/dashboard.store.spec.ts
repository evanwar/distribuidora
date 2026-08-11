import { toDashboardView } from './dashboard.store';

describe('dashboard view', () => {
  it('maps the operational summary and analytics', () => {
    const view = toDashboardView({
      todaySales: 1250,
      todayTransactions: 8,
      inventoryUnits: 240,
      lowStockProducts: 2,
      receivables: 350,
      salesTrend: [{ date: '2026-08-11', sales: 1250, transactions: 8 }],
      inventoryHealth: {
        healthyProducts: 12,
        lowStockProducts: 2,
        outOfStockProducts: 1,
        availableUnits: 220,
        reservedUnits: 20,
      },
      receivablesAging: { current: 200, days1To30: 100, days31To60: 50, days61To90: 0, over90: 0 },
    });

    expect(view.metrics).toHaveLength(5);
    expect(view.salesTrend[0]?.sales).toBe(1250);
    expect(view.inventoryHealth.healthyProducts).toBe(12);
    expect(view.receivablesAging.days31To60).toBe(50);
  });

  it('keeps the five KPIs compatible with the previous response shape', () => {
    const view = toDashboardView({ todaySales: 0, inventoryUnits: 31 });

    expect(view.metrics).toHaveLength(5);
    expect(view.metrics.find((metric) => metric.key === 'inventoryUnits')?.value).toBe(31);
    expect(view.salesTrend).toEqual([]);
  });
});
