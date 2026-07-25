---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# Skill 03 - Domain Events

## Objetivo

Registrar y comunicar hechos importantes del negocio sin acoplar módulos innecesariamente.

## Eventos sugeridos

```text
GoodsReceiptClosedDomainEvent
InventoryMovementCreatedDomainEvent
StockBalanceChangedDomainEvent
CounterSaleConfirmedDomainEvent
SalePaymentRegisteredDomainEvent
AccountReceivableCreatedDomainEvent
CounterSaleCancelledDomainEvent
InventoryAdjustmentConfirmedDomainEvent
```

## Reglas

- El evento debe representar algo que ya ocurrió.
- Nombrar en pasado: `CounterSaleConfirmedDomainEvent`.
- No usar eventos para pedir permiso o validar reglas previas.
- El agregado agrega eventos; Application los publica.
- Para efectos posteriores, usar Outbox.

## Outbox mínimo

Tabla sugerida:

```text
OutboxMessages
- Id
- OccurredAt
- Type
- Payload
- ProcessedAt
- Error
- RetryCount
```

## Cuándo usar evento

Usa evento cuando:

- Otra parte del sistema debe reaccionar.
- Se necesita auditoría funcional.
- Se quiere desacoplar creación de movimientos, reportes o notificaciones internas.

No uses evento para reemplazar transacciones críticas de inventario cuando el cambio debe ocurrir de forma atómica.
