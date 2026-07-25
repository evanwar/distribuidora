---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# M08 - Reportes y dashboard backend de mostrador

## Prompt para agente

```text
Eres un agente senior de backend .NET especializado en reporting operativo. Implementa consultas optimizadas para inventario, ventas, compras, cobranza y utilidad bruta del MVP de mostrador. No implementes BI avanzado ni procesos logísticos externos.
```

## Fase

Sprint 6

## Dependencias

```text
M01
M02
M03
M04
M05
M06
```

## Skills obligatorias

```text
../skills/skill_01_clean_architecture.md
../skills/skill_02_vertical_slice.md
../skills/skill_03_domain_events.md
../skills/skill_04_efcore_postgresql_codefirst.md
../skills/skill_05_api_validation_security.md
../skills/skill_06_testing_acceptance.md
../skills/skill_07_inventory_consistency.md
../skills/skill_08_counter_sales_consistency.md
```

## Objetivo

Exponer endpoints de consulta para que administración vea ventas, inventario, productos bajos, cuentas por cobrar y utilidad estimada.

## Alcance mínimo

Implementar reportes backend mínimos, paginados y filtrables. Usar queries optimizadas y no cargar agregados completos si no es necesario.

## Entidades / tablas mínimas

- No crear entidades de dominio salvo vistas/materialized views opcionales.
- ReportQueryLog opcional: reportName, filters, requestedBy, requestedAt, elapsedMs

## Endpoints mínimos

- GET /api/reports/sales-summary
- GET /api/reports/sales-by-product
- GET /api/reports/gross-profit
- GET /api/reports/inventory-summary
- GET /api/reports/low-stock
- GET /api/reports/purchases-summary
- GET /api/reports/accounts-receivable-aging
- GET /api/dashboard/summary

## Reglas de negocio

- Los reportes no modifican estado.
- Filtrar por fecha con límites razonables.
- Utilidad bruta usa precio y costo histórico guardado en venta.
- Stock bajo compara existencia contra mínimo del producto.
- Cuentas por cobrar vencidas se calculan contra fecha de vencimiento.
- Dashboard debe ser rápido y usar agregaciones simples.

## Validaciones mínimas

- Fecha inicio menor o igual a fecha fin.
- Rangos extensos pueden requerir permiso o paginación.
- No exponer datos de auditoría sensible en reportes generales.
- Filtros inválidos regresan error controlado.
- Exportaciones quedan fuera salvo que se autorice.

## Domain Events sugeridos

- ReportRequestedDomainEvent opcional
- DashboardViewedDomainEvent opcional

## Vertical slices sugeridos

- GetSalesSummary
- GetSalesByProduct
- GetGrossProfitReport
- GetInventorySummary
- GetLowStockReport
- GetPurchasesSummary
- GetReceivablesAging
- GetDashboardSummary

## Persistencia EF Core / PostgreSQL

- Crear configuraciones con `IEntityTypeConfiguration<T>`.
- Usar claves primarias `Guid` o `Ulid` de forma consistente.
- Definir índices únicos en claves naturales como folio, SKU, código de barras, email o RFC cuando aplique.
- Usar `numeric(18,2)` para dinero y `numeric(18,4)` para cantidades.
- Agregar campos auditables.
- Usar `RowVersion` o token de concurrencia en documentos críticos y balances.
- Incluir migración con nombre: `AddReportQueryLogOptional`.

## Seguridad y permisos

- Permisos: reports.view, reports.financial, reports.inventory.
- Reportes financieros requieren permiso específico.
- Auditar consultas financieras si la política lo exige.

## Pruebas mínimas

- resumen de ventas calcula totales
- utilidad usa costo histórico
- stock bajo respeta mínimo
- cuentas vencidas se agrupan por antigüedad
- reporte no modifica datos

## Criterios de aceptación

- El módulo compila sin dependencias circulares.
- Los endpoints aparecen en Swagger.
- Las reglas de negocio están en Domain/Application, no en Api.
- Las migraciones aplican en PostgreSQL.
- Las pruebas unitarias y de integración del módulo pasan.
- El módulo no rompe reglas globales de inventario, auditoría ni seguridad.
- El módulo no introduce dependencias fuera del alcance de ventas por mostrador.

## Checklist para el agente antes de terminar

```text
[ ] Código compila
[ ] Migración EF Core creada
[ ] Seeds agregados si aplican
[ ] Endpoints documentados
[ ] Validadores creados
[ ] Permisos definidos
[ ] Auditoría considerada
[ ] Domain events levantados
[ ] Tests unitarios agregados
[ ] Tests de integración agregados
[ ] README/notas técnicas actualizadas si aplica
```
