---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# Skill 07 - Consistencia de inventario

## Objetivo

Evitar pérdidas de trazabilidad y descuadres de stock.

## Regla principal

`StockBalance` nunca se cambia solo. Siempre debe existir `InventoryMovement`.

## Operaciones que crean movimientos

```text
GoodsReceipt closed -> purchaseReceipt
CounterSale confirmed -> counterSale
CounterSale cancelled -> saleCancellation
InventoryAdjustment confirmed -> adjustment
InternalTransfer -> internalTransfer
```

## Validación de stock

Antes de una salida:

1. Bloquear o leer balance con control de concurrencia.
2. Validar cantidad disponible.
3. Crear movimiento.
4. Actualizar balance.
5. Guardar todo en la misma transacción.

## Kardex

Kardex debe poder explicar:

- Fecha.
- Tipo de movimiento.
- Entrada.
- Salida.
- Saldo resultante.
- Referencia.
- Usuario.

## Antipatrones prohibidos

- `product.Stock = product.Stock - quantity`.
- Stock almacenado únicamente en `Product`.
- Ajustes sin motivo.
- Movimientos sin referencia.
- Cancelaciones que borran movimientos originales.
