---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# M03 - Inventario central, existencias y kardex

## Prompt para agente

```text
Eres un agente senior de backend .NET especializado en inventario. Implementa existencias por almacén central/mostrador, movimientos, kardex, transferencias internas simples y ajustes. No agregues almacenes móviles ni conceptos logísticos externos. Usa transacciones, concurrencia y Domain Events.
```

## Fase

Sprint 2

## Dependencias

```text
M01
M02
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

Controlar cantidades por producto y ubicación interna de mostrador. Este módulo debe explicar por qué existe cada cantidad.

## Alcance mínimo

Implementar `StockBalance`, `InventoryMovement`, `InventoryAdjustment` y consultas de kardex. Toda entrada, salida o ajuste debe ser trazable y transaccional.

## Entidades / tablas mínimas

- StockBalance: warehouseId, productId, quantity, reservedQuantity, rowVersion
- InventoryMovement: folio, date, movementType, productId, quantity, sourceWarehouseId, destinationWarehouseId, unitCost, referenceType, referenceId, notes, createdBy
- InventoryAdjustment: folio, warehouseId, reason, status, authorizedBy, confirmedAt, cancelledAt
- InventoryAdjustmentItem: adjustmentId, productId, systemQuantity, physicalQuantity, differenceQuantity, unitCost
- MovementType enum: purchaseReceipt, counterSale, saleCancellation, adjustment, internalTransfer, manualCorrection

## Endpoints mínimos

- GET /api/inventory/balances
- GET /api/inventory/kardex
- GET /api/inventory/low-stock
- POST /api/inventory/adjustments
- POST /api/inventory/adjustments/{id}/confirm
- POST /api/inventory/adjustments/{id}/cancel
- POST /api/inventory/transfers

## Reglas de negocio

- Toda entrada o salida crea `InventoryMovement`.
- `StockBalance` se actualiza solo como consecuencia de movimientos dentro de transacción.
- No permitir stock negativo salvo permiso excepcional y auditoría.
- Cada movimiento debe tener referencia de negocio.
- El costo histórico del movimiento se conserva.
- Los ajustes confirmados no se editan.

## Validaciones mínimas

- Cantidad mayor a cero en movimientos normales.
- Motivo obligatorio en ajustes.
- Producto y almacén activos.
- Usuario autorizado para ajustes y transferencias.
- Concurrencia controlada al modificar existencias.
- No confirmar ajuste sin detalles.

## Domain Events sugeridos

- InventoryMovementCreatedDomainEvent
- StockBalanceChangedDomainEvent
- InventoryAdjustmentCreatedDomainEvent
- InventoryAdjustmentConfirmedDomainEvent
- LowStockDetectedDomainEvent

## Vertical slices sugeridos

- GetStockBalances
- GetProductKardex
- CreateInventoryAdjustment
- ConfirmInventoryAdjustment
- CancelInventoryAdjustment
- CreateInternalTransfer
- GetLowStockProducts

## Persistencia EF Core / PostgreSQL

- Crear configuraciones con `IEntityTypeConfiguration<T>`.
- Usar claves primarias `Guid` o `Ulid` de forma consistente.
- Definir índices únicos en claves naturales como folio, SKU, código de barras, email o RFC cuando aplique.
- Usar `numeric(18,2)` para dinero y `numeric(18,4)` para cantidades.
- Agregar campos auditables.
- Usar `RowVersion` o token de concurrencia en documentos críticos y balances.
- Incluir migración con nombre: `AddInventoryStockBalancesAndKardex`.

## Seguridad y permisos

- Permisos: inventory.view, inventory.adjust, inventory.transfer, inventory.cancel_adjustment.
- Auditar ajustes, transferencias y cualquier operación que genere movimiento manual.

## Pruebas mínimas

- entrada aumenta stock
- salida descuenta stock
- no permite stock negativo sin permiso
- kardex muestra movimientos en orden
- concurrencia evita sobreescritura de balance

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
