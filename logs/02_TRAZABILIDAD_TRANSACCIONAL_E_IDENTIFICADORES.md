# Trazabilidad transaccional e identificadores

## Objetivo

Permitir que soporte, auditoría o desarrollo reconstruyan una operación completa desde su origen hasta sus movimientos, eventos y errores.

## Identificadores obligatorios

### `correlationId`

Identifica una petición HTTP.

Debe:

- aceptarse desde `X-Correlation-ID` cuando sea válido;
- generarse cuando no exista;
- devolverse en la respuesta;
- propagarse a logs, errores y eventos;
- mantenerse durante toda la ejecución de esa petición.

### `operationId`

Identifica una operación funcional de negocio.

Ejemplos:

```text
Crear una venta
Confirmar una venta
Cancelar una venta
Cerrar una recepción
Registrar un ajuste
Aplicar un pago
Cambiar precio
```

Debe compartirse entre:

```text
documento
detalles
movimientos de inventario
pagos
auditorías
Outbox
Domain Events
errores derivados
```

Se recomienda ULID por orden temporal, aunque UUID también es válido.

### `traceId`

Identificador técnico de `System.Diagnostics.Activity`.

Debe permitir integración futura con OpenTelemetry.

### `requestId`

Identificador técnico de la solicitud dentro del servidor.

Puede corresponder a `HttpContext.TraceIdentifier`.

### `transactionId`

Identifica la transacción lógica de base de datos.

No debe depender exclusivamente del identificador interno de PostgreSQL. Generar un valor de aplicación y conservarlo en los registros auditables.

### `eventId`

Identifica individualmente un Domain Event u Outbox Message.

### `causationId`

Identifica el comando, evento o mensaje que originó otro mensaje.

Ejemplo:

```text
ConfirmSaleCommand
  -> SaleConfirmedDomainEvent
     -> InventoryUpdatedEvent
```

Cada elemento tiene su propio `eventId`; el siguiente conserva el `eventId` anterior como `causationId`.

### Referencias funcionales

```text
referenceType
referenceId
referenceFolio
entityName
entityId
```

El folio es visible para el usuario:

```text
VTA-2026-000123
REC-2026-000041
AJU-2026-000008
```

## Matriz de propagación

| Registro | correlationId | operationId | traceId | transactionId | eventId | causationId |
|---|---:|---:|---:|---:|---:|---:|
| UserActivityLog | Sí | Sí | Sí | Opcional | No | Opcional |
| AuditLog | Sí | Sí | Sí | Sí | Opcional | Opcional |
| SystemErrorLog | Sí | Sí | Sí | Opcional | Opcional | Opcional |
| SystemEventLog | Sí | Sí | Sí | Opcional | Sí | Sí |
| InventoryMovement | Sí | Sí | Opcional | Sí | Opcional | Opcional |
| OutboxMessage | Sí | Sí | Sí | Sí | Sí | Sí |
| Sale | Opcional | Sí | No | Opcional | No | No |
| Payment | Opcional | Sí | No | Opcional | No | No |

## Creación del `operationId`

### Comando inicial

Cuando un comando inicia una nueva operación:

```text
operationId = nuevo ULID
```

### Reintento idempotente

Cuando el cliente reintenta la misma operación mediante una clave de idempotencia:

```text
operationId = el de la operación original
```

### Operación derivada

Una operación derivada puede:

- conservar el mismo `operationId` si forma parte de la misma unidad funcional;
- crear otro `operationId` y guardar `parentOperationId` cuando sea una nueva unidad de negocio.

## Ejemplo: confirmación de venta

```text
referenceFolio: VTA-2026-000123
operationId: 01JY8A5N3Y87M5GH1YRQ9T1X8Q
correlationId: 5ac786ef-1037-4aae-9387-d51c6a9fac57
transactionId: 8f0d7418-41be-4127-b6b0-7c708d264c53
```

La misma operación relaciona:

```text
sales
sale_items
payments
inventory_movements
stock_balances
audit_logs
outbox_messages
system_event_logs
```

## Manejo transaccional

### Operación exitosa

```text
BEGIN
  guardar documento
  guardar detalles
  crear movimientos
  actualizar saldos
  guardar auditoría
  guardar Outbox
COMMIT
```

Todos comparten `operationId` y `transactionId`.

### Operación fallida

```text
BEGIN
  cambios parciales
  excepción
ROLLBACK
```

Después:

```text
BEGIN TRANSACTION INDEPENDIENTE
  guardar SystemErrorLog
COMMIT
```

El error conserva:

```text
operationId
correlationId
traceId
referenceFolio
entityId si ya estaba disponible
```

## Actividad de usuario

`UserActivityLog` se escribe al finalizar la petición, en una operación independiente.

Debe reflejar:

- resultado exitoso o fallido;
- código HTTP;
- duración;
- usuario;
- ruta;
- acción;
- `operationId`;
- `correlationId`.

## Reglas de búsqueda

El sistema debe poder encontrar una operación mediante:

```text
operationId
correlationId
referenceFolio
entityId
eventId
error fingerprint
usuario + rango de fechas
```

## Regla final

`correlationId` responde: **¿qué ocurrió en esta petición?**

`operationId` responde: **¿qué ocurrió en toda esta operación de negocio?**

`transactionId` responde: **¿qué cambios se confirmaron juntos?**

`eventId` y `causationId` responden: **¿qué evento originó al siguiente?**
