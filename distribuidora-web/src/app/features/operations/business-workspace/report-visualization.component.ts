import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface ReportMetric {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly progress: number;
}

export interface ReportBar {
  readonly label: string;
  readonly detail?: string;
  readonly value: string;
  readonly percent: number;
}

export interface ReportSegment {
  readonly label: string;
  readonly value: string;
  readonly percent: number;
  readonly color: string;
}

export interface ReportVisualization {
  readonly eyebrow: string;
  readonly title: string;
  readonly insight: string;
  readonly chartTitle: string;
  readonly chartCaption: string;
  readonly metrics: readonly ReportMetric[];
  readonly bars: readonly ReportBar[];
  readonly segments: readonly ReportSegment[];
  readonly totalLabel?: string;
  readonly totalValue?: string;
}

@Component({
  selector: 'app-report-visualization',
  imports: [DecimalPipe],
  template: `
    @if (visualization(); as view) {
      <section class="report-view" [attr.aria-label]="view.title">
        <header class="report-hero">
          <div>
            <span class="report-hero__eyebrow">{{ view.eyebrow }}</span>
            <h3>{{ view.title }}</h3>
            <p>{{ view.insight }}</p>
          </div>
          <span class="report-hero__pulse" aria-hidden="true">
            <i></i><i></i><i></i><i></i><i></i>
          </span>
        </header>

        <div class="kpi-grid">
          @for (metric of view.metrics; track metric.label; let index = $index) {
            <article class="kpi" [class]="'kpi kpi--' + (index % 4)">
              <div class="kpi__top">
                <span>{{ metric.label }}</span>
                <span class="kpi__signal" aria-hidden="true"></span>
              </div>
              <strong>{{ metric.value }}</strong>
              <small>{{ metric.detail }}</small>
              <span class="kpi__track" aria-hidden="true">
                <i [style.width.%]="metric.progress"></i>
              </span>
            </article>
          }
        </div>

        @if (view.bars.length || view.segments.length) {
          <div class="chart-grid" [class.chart-grid--single]="!view.segments.length">
            @if (view.bars.length) {
              <article class="chart-card chart-card--bars">
                <header class="chart-card__header">
                  <div>
                    <span>{{ text('Comparativo visual', 'Visual comparison') }}</span>
                    <h4>{{ view.chartTitle }}</h4>
                  </div>
                </header>
                <p class="chart-caption">{{ view.chartCaption }}</p>
                <div class="bar-chart">
                  @for (bar of view.bars; track bar.label) {
                    <div class="bar-row">
                      <div class="bar-row__label">
                        <span>
                          <strong>{{ bar.label }}</strong>
                          @if (bar.detail) {
                            <small>{{ bar.detail }}</small>
                          }
                        </span>
                        <b>{{ bar.value }}</b>
                      </div>
                      <div
                        class="bar-row__track"
                        role="img"
                        [attr.aria-label]="bar.label + ': ' + bar.value"
                      >
                        <i [style.width.%]="bar.percent"><span></span></i>
                      </div>
                    </div>
                  }
                </div>
              </article>
            }

            @if (view.segments.length) {
              <article class="chart-card chart-card--donut">
                <header class="chart-card__header">
                  <div>
                    <span>{{ text('Distribución', 'Distribution') }}</span>
                    <h4>{{ text('Composición del indicador', 'Indicator composition') }}</h4>
                  </div>
                </header>
                <div class="donut-wrap">
                  <div
                    class="donut"
                    [style.background]="donutBackground(view.segments)"
                    role="img"
                    [attr.aria-label]="view.totalLabel + ': ' + view.totalValue"
                  >
                    <div class="donut__center">
                      <span>{{ view.totalLabel }}</span>
                      <strong>{{ view.totalValue }}</strong>
                    </div>
                  </div>
                  <div class="legend">
                    @for (segment of view.segments; track segment.label) {
                      <div class="legend__item">
                        <i [style.background]="segment.color"></i>
                        <span
                          ><strong>{{ segment.label }}</strong
                          ><small>{{ segment.value }}</small></span
                        >
                        <b>{{ segment.percent | number: '1.0-0' }}%</b>
                      </div>
                    }
                  </div>
                </div>
              </article>
            }
          </div>
        }
      </section>
    }
  `,
  styleUrl: './report-visualization.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportVisualizationComponent {
  readonly operationId = input.required<string>();
  readonly result = input.required<unknown>();
  readonly locale = input('es-MX');
  readonly english = input(false);

  protected readonly visualization = computed(() =>
    buildReportVisualization(this.operationId(), this.result(), this.locale(), this.english()),
  );

  protected text(spanish: string, english: string): string {
    return this.english() ? english : spanish;
  }

  protected donutBackground(segments: readonly ReportSegment[]): string {
    let start = 0;
    const stops = segments.map((segment) => {
      const end = start + segment.percent;
      const stop = `${segment.color} ${start}% ${end}%`;
      start = end;
      return stop;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }
}

export function buildReportVisualization(
  operationId: string,
  result: unknown,
  locale: string,
  english: boolean,
): ReportVisualization | null {
  const t = (spanish: string, englishText: string) => (english ? englishText : spanish);
  const money = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(value);
  const number = (value: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  const percent = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value);
  const record = asRecord(result);
  const collection = asCollection(result);

  if (operationId === 'DSH-01' && record) {
    const sales = num(record['todaySales']);
    const transactions = num(record['todayTransactions']);
    const inventory = num(record['inventoryUnits']);
    const lowStock = num(record['lowStockProducts']);
    const receivables = num(record['receivables']);
    return {
      eyebrow: t('Pulso del negocio', 'Business pulse'),
      title: t('Lo esencial, de un vistazo', 'Everything essential, at a glance'),
      insight: t(
        `Hoy se registran ${number(transactions)} transacciones. La cartera pendiente asciende a ${money(receivables)}.`,
        `${number(transactions)} transactions have been recorded today. Outstanding receivables total ${money(receivables)}.`,
      ),
      chartTitle: t('Balance operativo', 'Operating balance'),
      chartCaption: t(
        'Escala relativa dentro de cada indicador.',
        'Relative scale within each indicator.',
      ),
      metrics: [
        metric(
          t('Ventas de hoy', "Today's sales"),
          money(sales),
          t('Ingreso confirmado', 'Confirmed revenue'),
          82,
        ),
        metric(
          t('Transacciones', 'Transactions'),
          number(transactions),
          t('Operaciones de hoy', 'Today operations'),
          65,
        ),
        metric(
          t('Unidades en inventario', 'Inventory units'),
          number(inventory),
          t('Existencia registrada', 'Registered stock'),
          76,
        ),
        metric(
          t('Cartera por cobrar', 'Receivables'),
          money(receivables),
          t('Saldo pendiente', 'Outstanding balance'),
          58,
        ),
      ],
      bars: normalizedBars([
        [t('Inventario', 'Inventory'), inventory, number(inventory)],
        [t('Stock bajo', 'Low stock'), lowStock, number(lowStock)],
        [t('Transacciones', 'Transactions'), transactions, number(transactions)],
      ]),
      segments: ratioSegments(
        [
          [t('Ventas', 'Sales'), sales, '#35d2b1'],
          [t('Cartera', 'Receivables'), receivables, '#6c7cff'],
        ],
        money,
      ),
      totalLabel: t('Flujo monetario', 'Cash flow'),
      totalValue: money(sales + receivables),
    };
  }

  if (operationId === 'RPT-01' && record) {
    const count = num(record['count']);
    const subtotal = num(record['subtotal']);
    const discounts = num(record['discounts']);
    const taxes = num(record['taxes']);
    const total = num(record['total']);
    const paid = num(record['paid']);
    const balance = num(record['balance']);
    const coverage = safeRatio(paid, total);
    return {
      eyebrow: t('Desempeño comercial', 'Commercial performance'),
      title: t('Radiografía de ventas', 'Sales snapshot'),
      insight: t(
        `Se ha cobrado ${percent(coverage)} del total vendido. El ticket promedio es de ${money(safeRatio(total, count))}.`,
        `${percent(coverage)} of total sales has been collected. Average ticket is ${money(safeRatio(total, count))}.`,
      ),
      chartTitle: t('Construcción del ingreso', 'Revenue composition'),
      chartCaption: t(
        'Importes que explican el total del periodo.',
        'Amounts that explain the period total.',
      ),
      metrics: [
        metric(
          t('Ventas totales', 'Total sales'),
          money(total),
          t('Importe del periodo', 'Period amount'),
          100,
        ),
        metric(
          t('Operaciones', 'Transactions'),
          number(count),
          t('Ventas confirmadas', 'Confirmed sales'),
          72,
        ),
        metric(
          t('Ticket promedio', 'Average ticket'),
          money(safeRatio(total, count)),
          t('Total por operación', 'Total per transaction'),
          64,
        ),
        metric(
          t('Por cobrar', 'Outstanding'),
          money(balance),
          t('Saldo pendiente', 'Pending balance'),
          Math.max(6, safeRatio(balance, total) * 100),
        ),
      ],
      bars: normalizedBars([
        [t('Subtotal', 'Subtotal'), subtotal, money(subtotal)],
        [t('Impuestos', 'Taxes'), taxes, money(taxes)],
        [t('Descuentos', 'Discounts'), discounts, money(discounts)],
      ]),
      segments: ratioSegments(
        [
          [t('Cobrado', 'Collected'), paid, '#35d2b1'],
          [t('Pendiente', 'Outstanding'), balance, '#ffb84d'],
        ],
        money,
      ),
      totalLabel: t('Venta total', 'Total sales'),
      totalValue: money(total),
    };
  }

  if (operationId === 'RPT-02') {
    const rows = collection
      .map((item, index) => ({
        label: `${t('Producto', 'Product')} ${String(index + 1).padStart(2, '0')}`,
        detail: shortId(String(item['productId'] ?? '')),
        quantity: num(item['quantity']),
        revenue: num(item['revenue']),
      }))
      .sort((a, b) => b.revenue - a.revenue);
    const revenue = sum(rows.map((row) => row.revenue));
    const quantity = sum(rows.map((row) => row.quantity));
    const topShare = safeRatio(rows[0]?.revenue ?? 0, revenue);
    return {
      eyebrow: t('Mix de productos', 'Product mix'),
      title: t('Los productos que mueven el negocio', 'The products driving the business'),
      insight: rows.length
        ? t(
            `El producto líder concentra ${percent(topShare)} del ingreso analizado.`,
            `The leading product accounts for ${percent(topShare)} of analyzed revenue.`,
          )
        : t(
            'No hay ventas por producto en el periodo seleccionado.',
            'There are no product sales in the selected period.',
          ),
      chartTitle: t('Ranking por ingreso', 'Revenue ranking'),
      chartCaption: t('Los 8 productos con mayor aportación.', 'Top 8 products by contribution.'),
      metrics: [
        metric(
          t('Ingreso analizado', 'Analyzed revenue'),
          money(revenue),
          t('Suma del portafolio', 'Portfolio total'),
          100,
        ),
        metric(
          t('Unidades vendidas', 'Units sold'),
          number(quantity),
          t('Volumen acumulado', 'Accumulated volume'),
          78,
        ),
        metric(
          t('Productos con venta', 'Products sold'),
          number(rows.length),
          t('Productos distintos', 'Distinct products'),
          68,
        ),
        metric(
          t('Ingreso por unidad', 'Revenue per unit'),
          money(safeRatio(revenue, quantity)),
          t('Promedio ponderado', 'Weighted average'),
          61,
        ),
      ],
      bars: rows.slice(0, 8).map((row) => ({
        label: row.label,
        detail: `${row.detail} · ${number(row.quantity)} ${t('unidades', 'units')}`,
        value: money(row.revenue),
        percent: Math.max(4, safeRatio(row.revenue, rows[0]?.revenue ?? 0) * 100),
      })),
      segments: ratioSegments(
        rows
          .slice(0, 4)
          .map(
            (row, index) =>
              [
                row.label,
                row.revenue,
                ['#6c7cff', '#35d2b1', '#ffb84d', '#ff6b8a'][index],
              ] as const,
          ),
        money,
      ),
      totalLabel: t('Top 4', 'Top 4'),
      totalValue: money(sum(rows.slice(0, 4).map((row) => row.revenue))),
    };
  }

  if (operationId === 'RPT-03' && record) {
    const revenue = num(record['revenue']);
    const cost = num(record['historicalCost']);
    const profit = num(record['grossProfit']);
    const margin = safeRatio(profit, revenue);
    return {
      eyebrow: t('Rentabilidad', 'Profitability'),
      title: t('Margen bruto bajo control', 'Gross margin under control'),
      insight: t(
        `Cada peso vendido genera ${number(margin)} pesos de utilidad bruta.`,
        `Each peso sold generates ${number(margin)} pesos of gross profit.`,
      ),
      chartTitle: t('Ingreso, costo y utilidad', 'Revenue, cost and profit'),
      chartCaption: t(
        'Relación directa entre los componentes del margen.',
        'Direct relationship between margin components.',
      ),
      metrics: [
        metric(t('Ingreso', 'Revenue'), money(revenue), t('Venta neta', 'Net sales'), 100),
        metric(
          t('Utilidad bruta', 'Gross profit'),
          money(profit),
          t('Antes de gastos operativos', 'Before operating expenses'),
          Math.max(4, margin * 100),
        ),
        metric(
          t('Margen bruto', 'Gross margin'),
          percent(margin),
          t('Rentabilidad sobre ingreso', 'Return on revenue'),
          Math.max(4, margin * 100),
        ),
        metric(
          t('Costo histórico', 'Historical cost'),
          money(cost),
          t('Costo de lo vendido', 'Cost of goods sold'),
          Math.max(4, safeRatio(cost, revenue) * 100),
        ),
      ],
      bars: normalizedBars([
        [t('Ingreso', 'Revenue'), revenue, money(revenue)],
        [t('Costo', 'Cost'), cost, money(cost)],
        [t('Utilidad', 'Profit'), profit, money(profit)],
      ]),
      segments: ratioSegments(
        [
          [t('Costo', 'Cost'), cost, '#6c7cff'],
          [t('Utilidad', 'Profit'), Math.max(0, profit), '#35d2b1'],
        ],
        money,
      ),
      totalLabel: t('Margen', 'Margin'),
      totalValue: percent(margin),
    };
  }

  if (operationId === 'RPT-04') {
    const rows = collection.map((item) => ({
      name: String(item['name'] ?? item['sku'] ?? t('Producto', 'Product')),
      sku: String(item['sku'] ?? ''),
      quantity: num(item['quantity']),
      reserved: num(item['reservedQuantity']),
      value: num(item['inventoryValue']),
    }));
    const units = sum(rows.map((row) => row.quantity));
    const reserved = sum(rows.map((row) => row.reserved));
    const inventoryValue = sum(rows.map((row) => row.value));
    const available = Math.max(0, units - reserved);
    const ranked = [...rows].sort((a, b) => b.value - a.value);
    return {
      eyebrow: t('Capital en inventario', 'Inventory capital'),
      title: t('Valor y disponibilidad de existencias', 'Stock value and availability'),
      insight: t(
        `${percent(safeRatio(available, units))} de las unidades está disponible para venta.`,
        `${percent(safeRatio(available, units))} of units are available for sale.`,
      ),
      chartTitle: t('Productos con mayor valor', 'Highest-value products'),
      chartCaption: t('Top 8 por valor de inventario.', 'Top 8 by inventory value.'),
      metrics: [
        metric(
          t('Valor de inventario', 'Inventory value'),
          money(inventoryValue),
          t('Capital registrado', 'Registered capital'),
          100,
        ),
        metric(
          t('Unidades totales', 'Total units'),
          number(units),
          t('Existencia física', 'Physical stock'),
          82,
        ),
        metric(
          t('Disponibles', 'Available'),
          number(available),
          t('Listas para venta', 'Ready for sale'),
          safeRatio(available, units) * 100,
        ),
        metric(
          t('Reservadas', 'Reserved'),
          number(reserved),
          t('Comprometidas', 'Committed'),
          Math.max(4, safeRatio(reserved, units) * 100),
        ),
      ],
      bars: ranked.slice(0, 8).map((row) => ({
        label: row.name,
        detail: `${row.sku} · ${number(row.quantity)} ${t('unidades', 'units')}`,
        value: money(row.value),
        percent: Math.max(4, safeRatio(row.value, ranked[0]?.value ?? 0) * 100),
      })),
      segments: ratioSegments(
        [
          [t('Disponible', 'Available'), available, '#35d2b1'],
          [t('Reservado', 'Reserved'), reserved, '#ffb84d'],
        ],
        number,
      ),
      totalLabel: t('Unidades', 'Units'),
      totalValue: number(units),
    };
  }

  if (operationId === 'RPT-05') {
    const rows = collection.map((item) => ({
      name: String(item['name'] ?? item['sku'] ?? t('Producto', 'Product')),
      sku: String(item['sku'] ?? ''),
      minimum: num(item['minimumStock']),
      quantity: num(item['quantity']),
    }));
    const shortage = sum(rows.map((row) => Math.max(0, row.minimum - row.quantity)));
    const outOfStock = rows.filter((row) => row.quantity <= 0).length;
    const ranked = [...rows].sort((a, b) => b.minimum - b.quantity - (a.minimum - a.quantity));
    return {
      eyebrow: t('Alerta de abastecimiento', 'Supply alert'),
      title: t('Riesgos de stock que requieren acción', 'Stock risks requiring action'),
      insight: t(
        `${outOfStock} productos están agotados y faltan ${number(shortage)} unidades para cubrir mínimos.`,
        `${outOfStock} products are out of stock and ${number(shortage)} units are needed to meet minimums.`,
      ),
      chartTitle: t('Brecha contra stock mínimo', 'Gap to minimum stock'),
      chartCaption: t(
        'Prioridad ordenada por unidades faltantes.',
        'Priority ordered by missing units.',
      ),
      metrics: [
        metric(
          t('Productos en riesgo', 'At-risk products'),
          number(rows.length),
          t('Igual o debajo del mínimo', 'At or below minimum'),
          100,
        ),
        metric(
          t('Agotados', 'Out of stock'),
          number(outOfStock),
          t('Existencia en cero', 'Zero stock'),
          Math.max(4, safeRatio(outOfStock, rows.length) * 100),
        ),
        metric(
          t('Unidades faltantes', 'Missing units'),
          number(shortage),
          t('Para recuperar mínimos', 'To restore minimums'),
          78,
        ),
        metric(
          t('Cobertura crítica', 'Critical coverage'),
          percent(1 - safeRatio(outOfStock, Math.max(1, rows.length))),
          t('Productos aún con existencia', 'Products still in stock'),
          62,
        ),
      ],
      bars: ranked.slice(0, 8).map((row) => {
        const gap = Math.max(0, row.minimum - row.quantity);
        return {
          label: row.name,
          detail: `${row.sku} · ${t('actual', 'current')}: ${number(row.quantity)} / ${t('mínimo', 'minimum')}: ${number(row.minimum)}`,
          value: `${number(gap)} ${t('faltantes', 'missing')}`,
          percent: Math.max(
            4,
            safeRatio(gap, Math.max(...ranked.map((item) => item.minimum - item.quantity), 0)) *
              100,
          ),
        };
      }),
      segments: ratioSegments(
        [
          [t('Agotados', 'Out of stock'), outOfStock, '#ff6b8a'],
          [t('Con existencia', 'In stock'), Math.max(0, rows.length - outOfStock), '#ffb84d'],
        ],
        number,
      ),
      totalLabel: t('En riesgo', 'At risk'),
      totalValue: number(rows.length),
    };
  }

  if (operationId === 'RPT-06' && record) {
    const count = num(record['count']);
    const subtotal = num(record['subtotal']);
    const tax = num(record['tax']);
    const total = num(record['total']);
    return {
      eyebrow: t('Compras y abastecimiento', 'Purchasing and supply'),
      title: t('Inversión en compras del periodo', 'Purchasing investment for the period'),
      insight: t(
        `El importe promedio por orden es ${money(safeRatio(total, count))}; ${percent(safeRatio(tax, total))} corresponde a impuestos.`,
        `Average order value is ${money(safeRatio(total, count))}; ${percent(safeRatio(tax, total))} corresponds to tax.`,
      ),
      chartTitle: t('Composición de compras', 'Purchase composition'),
      chartCaption: t('Base, impuestos y total del periodo.', 'Base, taxes and period total.'),
      metrics: [
        metric(
          t('Compras totales', 'Total purchases'),
          money(total),
          t('Inversión del periodo', 'Period investment'),
          100,
        ),
        metric(
          t('Órdenes', 'Orders'),
          number(count),
          t('Documentos considerados', 'Documents included'),
          72,
        ),
        metric(
          t('Promedio por orden', 'Average per order'),
          money(safeRatio(total, count)),
          t('Ticket de compra', 'Purchase ticket'),
          66,
        ),
        metric(
          t('Impuestos', 'Taxes'),
          money(tax),
          percent(safeRatio(tax, total)),
          Math.max(4, safeRatio(tax, total) * 100),
        ),
      ],
      bars: normalizedBars([
        [t('Total', 'Total'), total, money(total)],
        [t('Subtotal', 'Subtotal'), subtotal, money(subtotal)],
        [t('Impuestos', 'Taxes'), tax, money(tax)],
      ]),
      segments: ratioSegments(
        [
          [t('Subtotal', 'Subtotal'), subtotal, '#6c7cff'],
          [t('Impuestos', 'Taxes'), tax, '#35d2b1'],
        ],
        money,
      ),
      totalLabel: t('Total', 'Total'),
      totalValue: money(total),
    };
  }

  if (operationId === 'RPT-07' && record) {
    const buckets = [
      [t('Al corriente', 'Current'), num(record['current']), '#35d2b1'],
      [t('1–30 días', '1–30 days'), num(record['days1To30']), '#73a5ff'],
      [t('31–60 días', '31–60 days'), num(record['days31To60']), '#6c7cff'],
      [t('61–90 días', '61–90 days'), num(record['days61To90']), '#ffb84d'],
      [t('Más de 90 días', 'Over 90 days'), num(record['over90']), '#ff6b8a'],
    ] as const;
    const total = sum(buckets.map((bucket) => bucket[1]));
    const overdue = total - buckets[0][1];
    const critical = buckets[4][1];
    return {
      eyebrow: t('Salud de cartera', 'Receivables health'),
      title: t('Antigüedad y riesgo de saldos', 'Balance aging and risk'),
      insight: t(
        `${percent(safeRatio(overdue, total))} de la cartera está vencida; ${money(critical)} supera 90 días.`,
        `${percent(safeRatio(overdue, total))} of receivables is overdue; ${money(critical)} is over 90 days.`,
      ),
      chartTitle: t('Cartera por antigüedad', 'Receivables by age'),
      chartCaption: t(
        'Los saldos más antiguos requieren mayor atención.',
        'Older balances require more attention.',
      ),
      metrics: [
        metric(
          t('Cartera total', 'Total receivables'),
          money(total),
          t('Saldo analizado', 'Analyzed balance'),
          100,
        ),
        metric(
          t('Al corriente', 'Current'),
          money(buckets[0][1]),
          percent(safeRatio(buckets[0][1], total)),
          safeRatio(buckets[0][1], total) * 100,
        ),
        metric(
          t('Vencido', 'Overdue'),
          money(overdue),
          percent(safeRatio(overdue, total)),
          safeRatio(overdue, total) * 100,
        ),
        metric(
          t('Riesgo +90 días', 'Risk over 90 days'),
          money(critical),
          percent(safeRatio(critical, total)),
          Math.max(4, safeRatio(critical, total) * 100),
        ),
      ],
      bars: buckets.map(([label, value]) => ({
        label,
        value: money(value),
        percent: Math.max(
          4,
          safeRatio(value, Math.max(...buckets.map((bucket) => bucket[1]), 0)) * 100,
        ),
      })),
      segments: ratioSegments(buckets, money),
      totalLabel: t('Cartera', 'Receivables'),
      totalValue: money(total),
    };
  }

  return null;
}

function metric(label: string, value: string, detail: string, progress: number): ReportMetric {
  return { label, value, detail, progress: clamp(progress) };
}

function normalizedBars(
  rows: readonly (readonly [string, number, string])[],
): readonly ReportBar[] {
  const maximum = Math.max(...rows.map((row) => row[1]), 0);
  return rows.map(([label, raw, value]) => ({
    label,
    value,
    percent: Math.max(raw > 0 ? 4 : 0, safeRatio(raw, maximum) * 100),
  }));
}

function ratioSegments(
  rows: readonly (readonly [string, number, string])[],
  format: (value: number) => string,
): readonly ReportSegment[] {
  const positive = rows.map(([label, value, color]) => [label, Math.max(0, value), color] as const);
  const total = sum(positive.map((row) => row[1]));
  if (total <= 0) return [];
  return positive
    .filter((row) => row[1] > 0)
    .map(([label, value, color]) => ({
      label,
      value: format(value),
      percent: safeRatio(value, total) * 100,
      color,
    }));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asCollection(value: unknown): readonly Record<string, unknown>[] {
  const collection = Array.isArray(value)
    ? value
    : asRecord(value) && Array.isArray(asRecord(value)?.['items'])
      ? (asRecord(value)?.['items'] as readonly unknown[])
      : [];
  return collection.filter(
    (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object',
  );
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function safeRatio(value: number, total: number): number {
  return total > 0 ? value / total : 0;
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
}

function shortId(value: string): string {
  return value ? `${value.slice(0, 8)}…` : '—';
}
