---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# Skill 08 - Consistencia de ventas por mostrador

## Objetivo

Asegurar que las ventas por mostrador afecten inventario, pagos y cuentas por cobrar de forma coherente.

## Estados de venta

```text
Draft -> Confirmed -> Cancelled
```

Opcional:

```text
Confirmed -> Paid
Confirmed -> PartiallyPaid
Confirmed -> CreditPending
```

## Reglas de venta

- Una venta en borrador no afecta inventario.
- Una venta confirmada descuenta inventario.
- Una venta confirmada conserva precio y costo histórico.
- Una venta de contado requiere pago completo.
- Una venta a crédito requiere cliente activo y crédito permitido.
- Una venta mixta crea pago parcial y saldo pendiente.
- Una venta cancelada genera movimiento inverso, no borra el movimiento original.

## Cálculo de totales

```text
lineSubtotal = quantity * unitPrice
lineDiscount = discount
lineTotal = lineSubtotal - lineDiscount
saleSubtotal = sum(lineSubtotal)
saleDiscountTotal = sum(lineDiscount)
saleTotal = sum(lineTotal) + taxTotal
balance = saleTotal - paidAmount
```

## Pruebas obligatorias

- Confirmar venta con stock suficiente.
- Rechazar venta sin stock suficiente.
- Confirmar venta contado con pago completo.
- Rechazar contado con pago incompleto.
- Crear cuenta por cobrar en venta a crédito.
- Cancelar venta y revertir inventario.
