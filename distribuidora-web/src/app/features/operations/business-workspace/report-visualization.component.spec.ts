import { buildReportVisualization } from './report-visualization.component';

describe('report visualization', () => {
  it('builds sales KPIs and collection distribution', () => {
    const view = buildReportVisualization(
      'RPT-01',
      {
        count: 10,
        subtotal: 1000,
        discounts: 50,
        taxes: 152,
        total: 1102,
        paid: 900,
        balance: 202,
      },
      'es-MX',
      false,
    );

    expect(view?.metrics).toHaveLength(4);
    expect(view?.bars).toHaveLength(3);
    expect(view?.segments).toHaveLength(2);
    expect(view?.segments.reduce((total, item) => total + item.percent, 0)).toBeCloseTo(100);
  });

  it('sorts inventory products by value for its chart', () => {
    const view = buildReportVisualization(
      'RPT-04',
      [
        { sku: 'A', name: 'Producto A', quantity: 2, reservedQuantity: 0, inventoryValue: 20 },
        { sku: 'B', name: 'Producto B', quantity: 5, reservedQuantity: 1, inventoryValue: 100 },
      ],
      'es-MX',
      false,
    );

    expect(view?.bars[0]?.label).toBe('Producto B');
    expect(view?.metrics[2]?.value).toBe('6');
  });

  it('handles empty report collections without invalid percentages', () => {
    const view = buildReportVisualization('RPT-02', [], 'es-MX', false);

    expect(view?.bars).toEqual([]);
    expect(view?.segments).toEqual([]);
    expect(view?.metrics.every((metric) => Number.isFinite(metric.progress))).toBe(true);
  });
});
