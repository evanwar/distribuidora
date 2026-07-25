---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# 03 - Convenciones transversales obligatorias

## Respuesta estándar de API

```json
{
  "success": true,
  "data": {},
  "message": "Operación realizada correctamente",
  "errors": [],
  "correlationId": "..."
}
```

## Estados base de documentos

| Estado | Uso |
|---|---|
| Draft | Capturado, editable, no afecta inventario definitivo. |
| Confirmed | Validado, afecta inventario o dinero. |
| Closed | Final, no editable. |
| Cancelled | Invalidado con motivo obligatorio y usuario responsable. |

## Campos auditables mínimos

Toda entidad operativa debe considerar:

```text
Id
CreatedAt
CreatedBy
UpdatedAt
UpdatedBy
IsDeleted o Status
RowVersion
CancelReason
CancelledBy
CancelledAt
```

## Reglas globales de inventario

- No actualizar `StockBalance.Quantity` directamente desde un endpoint.
- Crear siempre `InventoryMovement`.
- Actualizar balance y movimiento dentro de la misma transacción.
- No permitir stock negativo salvo permiso explícito y auditoría.
- Cada movimiento debe tener referencia.

## Reglas globales de dinero

- Usar `decimal` en C#.
- Usar `numeric(18,2)` en PostgreSQL.
- No usar `double` o `float` para montos.
- Guardar precio histórico en detalle de venta.
- Guardar costo histórico estimado en detalle de venta.
- Toda diferencia por cancelación debe quedar en auditoría.

## Reglas de endpoints

- Endpoints de escritura requieren JWT.
- Endpoints críticos requieren permiso granular.
- Validar requests con FluentValidation.
- Usar paginación en listados.
- Usar filtros por estatus y búsqueda.
- Documentar Swagger con ejemplos.

## Nomenclatura de permisos

```text
module.action
```

Ejemplos:

```text
sales.create
sales.confirm
sales.cancel
inventory.adjust
purchases.close_receipt
reports.view
admin.configure
```

## Transacciones

Usar transacción en operaciones que afecten:

- Inventario.
- Pagos.
- Cuentas por cobrar.
- Cancelaciones.
- Cierres de recepción.
- Ajustes.

## Errores de negocio

Preferir errores controlados:

```text
InsufficientStockException
DocumentAlreadyConfirmedException
DocumentAlreadyCancelledException
CreditLimitExceededException
InvalidPaymentAmountException
ProductInactiveException
```

## Prohibiciones del MVP Mostrador

No crear endpoints o tablas relacionadas con operación logística externa. No usar términos de reparto como dependencia funcional de una venta por mostrador.
