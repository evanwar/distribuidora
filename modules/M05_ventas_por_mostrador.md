---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# M05 - Ventas por mostrador

## Prompt para agente

```text
Eres un agente senior de backend .NET especializado en ventas por mostrador. Implementa ventas desde almacén central o punto de venta interno, pagos de contado, ventas a crédito y cancelaciones controladas. No implementes ventas externas ni logística. Respeta inventario, auditoría, Domain Events y EF Core Code First con PostgreSQL.
```

## Fase

Sprint 4

## Dependencias

```text
M01
M02
M03
M04
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

Registrar ventas realizadas en mostrador, descontar inventario, conservar precios/costos históricos y registrar pagos o cuenta por cobrar.

## Alcance mínimo

Implementar creación, edición en borrador, confirmación, cancelación, consulta e impresión lógica de venta. La venta confirmada afecta inventario y dinero.

## Entidades / tablas mínimas

- CounterSale: folio, saleDate, customerId optional, sourceWarehouseId, status, paymentCondition cash/credit/mixed, subtotal, discountTotal, taxTotal, total, paidAmount, balance, notes
- CounterSaleItem: saleId, productId, quantity, unitPrice, discount, total, historicalUnitCost
- SalePayment: saleId, paymentDate, method cash/card/transfer/other, amount, reference, receivedBy
- SaleCancellation: saleId, reason, cancelledBy, cancelledAt, inventoryReverted, paymentsReverted

## Endpoints mínimos

- POST /api/counter-sales
- GET /api/counter-sales
- GET /api/counter-sales/{id}
- PUT /api/counter-sales/{id}
- POST /api/counter-sales/{id}/confirm
- POST /api/counter-sales/{id}/payments
- POST /api/counter-sales/{id}/cancel
- GET /api/counter-sales/{id}/summary
- GET /api/counter-sales/{id}/print
- GET /api/v1/counter-sales/{id}/billing-eligibility
- PUT /api/v1/counter-sales/{id}/billing-recipient
- GET /api/v1/counter-sales/{id}/fiscal-status
- PUT /api/v1/counter-sales/{id}/fiscal-coverage

## Reglas de negocio

- Al confirmar venta, descontar inventario del almacén origen.
- Guardar precio y costo histórico en cada detalle.
- Venta de contado debe quedar totalmente pagada al confirmar.
- Venta a crédito crea cuenta por cobrar por el saldo.
- Venta mixta permite pago parcial y saldo a crédito.
- Cancelación de venta confirmada genera movimiento inverso de inventario y revierte o marca pagos según política.
- No editar venta confirmada; corregir con cancelación o nota posterior.
- Asociar un receptor fiscal posterior no modifica `CounterSale.CustomerId`, inventario, pagos, cartera ni importes de la venta confirmada.
- Una venta no puede quedar cubierta simultáneamente por CFDI global vigente y CFDI nominativo vigente.
- El folio se genera desde configuración o servicio de folios.

## Validaciones mínimas

- Producto activo y con existencia suficiente.
- Cantidad mayor a cero.
- Precio unitario no negativo.
- No confirmar venta sin detalles.
- Cliente activo requerido para venta a crédito.
- Crédito permitido según límite, saldo y bloqueo.
- Pago no puede exceder total salvo política explícita.
- Motivo obligatorio para cancelar.

## Domain Events sugeridos

- CounterSaleCreatedDomainEvent
- CounterSaleConfirmedDomainEvent
- CounterSaleInventoryDiscountedDomainEvent
- SalePaymentRegisteredDomainEvent
- CreditAccountCreatedFromSaleDomainEvent
- CounterSaleCancelledDomainEvent
- CounterSaleInventoryReversedDomainEvent

## Vertical slices sugeridos

- CreateCounterSale
- UpdateDraftCounterSale
- ConfirmCounterSale
- RegisterSalePayment
- CancelCounterSale
- GetCounterSale
- GetCounterSales
- GetCounterSaleSummary
- PrintCounterSale

## Persistencia EF Core / PostgreSQL

- Crear configuraciones con `IEntityTypeConfiguration<T>`.
- Usar claves primarias `Guid` o `Ulid` de forma consistente.
- Definir índices únicos en claves naturales como folio, SKU, código de barras, email o RFC cuando aplique.
- Usar `numeric(18,2)` para dinero y `numeric(18,4)` para cantidades.
- Agregar campos auditables.
- Usar `RowVersion` o token de concurrencia en documentos críticos y balances.
- Incluir migración con nombre: `AddCounterSalesModule`.

## Seguridad y permisos

- Permisos: sales.view, sales.create, sales.edit_draft, sales.confirm, sales.register_payment, sales.cancel.
- Permisos fiscales: sales.view_billing_eligibility, sales.assign_billing_recipient, sales.replace_billing_recipient, sales.invoice, sales.cancel_invoice, sales.reconcile_invoice, sales.manage_global_invoice_replacement.
- Auditar confirmación, cobro y cancelación.
- Permiso especial para precio manual menor al precio mínimo si se configura.

## Pruebas mínimas

- venta confirmada descuenta stock central
- venta de contado requiere pago completo
- venta a crédito crea cuenta por cobrar
- venta mixta crea saldo pendiente
- cancelación genera movimiento inverso
- no permite confirmar sin existencia suficiente

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
