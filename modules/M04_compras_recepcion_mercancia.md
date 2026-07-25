---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# M04 - Compras y recepción de mercancía

## Prompt para agente

```text
Eres un agente senior de backend .NET especializado en compras e inventario. Implementa compras a proveedores y recepción de mercancía que incremente inventario central mediante movimientos. Respeta transacciones, costos históricos, auditoría y documentos cerrados.
```

## Fase

Sprint 3

## Dependencias

```text
M01
M02
M03
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

Registrar compras a proveedores y aumentar inventario al cerrar la recepción de mercancía.

## Alcance mínimo

Implementar órdenes de compra y recepciones. La compra por sí sola no aumenta inventario si se maneja recepción separada; la recepción cerrada sí genera movimientos.

## Entidades / tablas mínimas

- PurchaseOrder: folio, supplierId, date, status, subtotal, tax, total, notes
- PurchaseOrderItem: purchaseOrderId, productId, quantity, unitCost, discount, total
- GoodsReceipt: folio, purchaseOrderId optional, destinationWarehouseId, receivedAt, receivedBy, status, notes
- GoodsReceiptItem: goodsReceiptId, productId, receivedQuantity, unitCost, total

## Endpoints mínimos

- POST /api/purchases
- GET /api/purchases
- GET /api/purchases/{id}
- PUT /api/purchases/{id}
- POST /api/purchases/{id}/confirm
- POST /api/purchases/{id}/cancel
- POST /api/goods-receipts
- GET /api/goods-receipts/{id}
- POST /api/goods-receipts/{id}/close
- POST /api/goods-receipts/{id}/cancel

## Reglas de negocio

- La compra en borrador no afecta inventario.
- Al cerrar recepción, crear movimientos de entrada al almacén destino.
- Conservar costo unitario recibido para utilidad y último costo.
- No editar recepciones cerradas.
- Cancelar recepción cerrada requiere documento inverso o ajuste controlado.
- Una recepción debe estar asociada a proveedor directa o indirectamente por compra.

## Validaciones mínimas

- Proveedor activo.
- Productos activos.
- Costo no negativo y cantidad mayor a cero.
- No cerrar recepción sin detalles.
- Almacén destino activo.
- Motivo obligatorio para cancelar compra o recepción.

## Domain Events sugeridos

- PurchaseOrderCreatedDomainEvent
- PurchaseOrderConfirmedDomainEvent
- GoodsReceiptCreatedDomainEvent
- GoodsReceiptClosedDomainEvent
- GoodsReceiptInventoryPostedDomainEvent
- PurchaseCancelledDomainEvent

## Vertical slices sugeridos

- CreatePurchaseOrder
- ConfirmPurchaseOrder
- CancelPurchaseOrder
- CreateGoodsReceipt
- CloseGoodsReceipt
- CancelGoodsReceipt
- GetPurchaseOrder
- GetGoodsReceipt

## Persistencia EF Core / PostgreSQL

- Crear configuraciones con `IEntityTypeConfiguration<T>`.
- Usar claves primarias `Guid` o `Ulid` de forma consistente.
- Definir índices únicos en claves naturales como folio, SKU, código de barras, email o RFC cuando aplique.
- Usar `numeric(18,2)` para dinero y `numeric(18,4)` para cantidades.
- Agregar campos auditables.
- Usar `RowVersion` o token de concurrencia en documentos críticos y balances.
- Incluir migración con nombre: `AddPurchasesAndGoodsReceipts`.

## Seguridad y permisos

- Permisos: purchases.view, purchases.create, purchases.confirm, purchases.cancel, goods_receipts.close.
- Auditar cambios de costo y cierres de recepción.

## Pruebas mínimas

- compra confirmada no aumenta inventario
- recepción cerrada aumenta inventario
- recepción cerrada no se edita
- cancelación requiere motivo
- costo histórico queda en movimiento

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
