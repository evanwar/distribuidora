---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# F08 - Reportes y dashboard de mostrador

## Prompt del agente

```text
Implementa con Angular Material 3 y diseño mobile-first 100% responsive dashboard y reportes operativos consumiendo agregados del backend. No descargues transacciones completas para calcular métricas en el navegador.
```

## Objetivo

Mostrar información útil de ventas, inventario, compras, cobranza y auditoría con filtros claros.

## Slices mínimos

- Dashboard diario.
- Ventas por periodo.
- Productos más vendidos.
- Ventas contado vs crédito.
- Stock bajo mínimo.
- Compras/recepciones pendientes.
- Saldos vencidos.
- No mostrar exportación en el alcance actual: OpenAPI no expone una operación de exportación.

## Reglas UX

- Mostrar fecha de actualización.
- Filtros deben reflejarse en URL cuando sea útil.
- Gráficas acompañadas de tabla/resumen accesible.
- No usar animaciones que dificulten lectura.
- No inventar precisión o utilidad si backend no devuelve costo histórico.
- Diferenciar cero datos de error de consulta.

## Permisos esperados

```text
reports.dashboard.view
reports.sales.view
reports.inventory.view
reports.receivables.view
reports.export
```

## Pruebas críticas

- filtros cambian request.
- empty state no se presenta como error.
- error conserva filtros.
- exportación respeta permiso.
- métricas no se recalculan desde listas locales.

## Contrato Material y responsive

- Dashboard usa grid Material/CSS fluido: una columna móvil, dos en tableta y expansión progresiva en escritorio.
- Cada gráfica debe redimensionarse sin cortar e incluir resumen/tabla accesible.
- Filtros se colapsan en móvil sin perder selección ni acción aplicar/limpiar.
- Tarjetas KPI no deben forzar ancho mínimo ni truncar importes críticos.
- Tablas de detalle aplican estrategia responsive y exportación conserva acceso en móvil.

## Reglas de implementación

- Crear rutas lazy.
- Consumir API mediante adapter y cliente generado.
- Usar Signals para estado de feature.
- Usar Reactive Forms tipados cuando exista captura.
- Implementar loading, vacío, error, éxito y forbidden.
- Aplicar permisos en rutas y acciones.
- No duplicar reglas autoritativas del backend.
- Agregar pruebas unitarias/componentes y E2E crítico.

## Contrato de entrega

```text
[ ] route/slice implementado
[ ] componentes Angular Material accesibles
[ ] comportamiento responsive móvil/tableta/escritorio validado
[ ] sin overflow horizontal global
[ ] store/facade implementado
[ ] adapter OpenAPI implementado
[ ] validaciones implementadas
[ ] permisos aplicados
[ ] errores y correlationId manejados
[ ] tests agregados
[ ] ng test pasa
[ ] ng build pasa
```

## Endpoints obligatorios y cobertura

Integrar las 8 operaciones `DSH-01` y `RPT-01..RPT-07` de `../06_MATRIZ_ENDPOINTS_FRONTEND.md`.

Dashboard y reportes consumen agregados autoritativos. No descargar ventas, compras o movimientos para recalcular métricas en el navegador. El botón exportar permanece ausente hasta que exista endpoint OpenAPI.

## Composición mínima

- `dashboard-grid`, `kpi-card`, `report-filter-bar`;
- `sales-summary-report`, `sales-by-product-report`, `gross-profit-report`;
- `inventory-summary-report`, `low-stock-report`, `purchases-summary-report`, `receivables-aging-report`;
- `accessible-chart` exige resumen/tabla alternativa;
- `ui-money`, `ui-date-time`, `ui-filter-panel`, `ui-responsive-data-view`, `ui-empty-state` y `ui-error-state`.

KPI, gráfica y tabla se configuran mediante ViewModels; no crear una página distinta con tokens/estilos propios por cada reporte.
