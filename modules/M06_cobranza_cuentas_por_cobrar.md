---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# M06 - Cobranza y cuentas por cobrar

## Prompt para agente

```text
Eres un agente senior de backend .NET especializado en cuentas por cobrar. Implementa saldos de clientes generados por ventas por mostrador a crédito, pagos posteriores y aplicación de pagos. No agregues procesos de cobranza externa avanzada. Respeta auditoría, transacciones y Domain Events.
```

## Fase

Sprint 5

## Dependencias

```text
M01
M02
M05
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

Controlar ventas a crédito, pagos posteriores, saldos por cliente y estados de cuenta.

## Alcance mínimo

Implementar cuentas por cobrar generadas por ventas, pagos de cliente, aplicación de pagos y consulta de estados de cuenta.

## Entidades / tablas mínimas

- AccountReceivable: customerId, saleId, issueDate, dueDate, total, balance, status
- CustomerPayment: customerId, paymentDate, method, amount, reference, receivedBy, status
- PaymentAllocation: customerPaymentId, accountReceivableId, amountApplied
- CreditLimitHistory: customerId, previousLimit, newLimit, authorizedBy, reason, createdAt

## Endpoints mínimos

- GET /api/accounts-receivable
- GET /api/accounts-receivable/{id}
- POST /api/customer-payments
- POST /api/customer-payments/{id}/apply
- POST /api/customer-payments/{id}/cancel
- GET /api/customers/{id}/statement
- POST /api/customers/{id}/credit-limit

## Reglas de negocio

- Venta a crédito confirmada crea `AccountReceivable`.
- Pagos pueden aplicarse a una o varias cuentas.
- No exceder límite de crédito salvo autorización.
- Conservar historial de cambios de límite.
- Saldo del cliente debe poder recalcularse desde ventas, cuentas y pagos.
- No editar pagos aplicados; cancelar con motivo y reversa de aplicación.

## Validaciones mínimas

- Cliente activo.
- Monto de pago mayor a cero.
- No aplicar más del saldo pendiente.
- Referencia requerida según método de pago configurable.
- Motivo obligatorio para cancelar pago.
- Permiso especial para cambiar límite de crédito.

## Domain Events sugeridos

- AccountReceivableCreatedDomainEvent
- CustomerPaymentRegisteredDomainEvent
- PaymentAllocatedDomainEvent
- AccountReceivablePaidDomainEvent
- CreditLimitChangedDomainEvent
- CustomerPaymentCancelledDomainEvent

## Vertical slices sugeridos

- GetAccountsReceivable
- RegisterCustomerPayment
- ApplyCustomerPayment
- CancelCustomerPayment
- GetCustomerStatement
- ChangeCustomerCreditLimit

## Persistencia EF Core / PostgreSQL

- Crear configuraciones con `IEntityTypeConfiguration<T>`.
- Usar claves primarias `Guid` o `Ulid` de forma consistente.
- Definir índices únicos en claves naturales como folio, SKU, código de barras, email o RFC cuando aplique.
- Usar `numeric(18,2)` para dinero y `numeric(18,4)` para cantidades.
- Agregar campos auditables.
- Usar `RowVersion` o token de concurrencia en documentos críticos y balances.
- Incluir migración con nombre: `AddAccountsReceivableAndCustomerPayments`.

## Seguridad y permisos

- Permisos: receivables.view, receivables.register_payment, receivables.apply_payment, receivables.cancel_payment, receivables.change_credit_limit.
- Auditar pagos, cancelaciones y cambios de límite.

## Pruebas mínimas

- venta a crédito crea saldo
- pago reduce saldo
- no permite aplicar más del saldo
- pago cancelado restaura saldo
- cambio de límite genera historial

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
