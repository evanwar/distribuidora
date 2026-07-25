# Consultas administrativas y endpoints de trazabilidad

## Principios

- Usar Controllers MVC con `[ApiController]`.
- Heredar de `ControllerBase`.
- No usar Minimal APIs.
- Los Controllers solo delegan a queries de Application.
- Aplicar autorización por permiso.
- Paginar todos los listados.
- No exponer stack traces ni payloads sensibles.
- Registrar también la consulta administrativa en `UserActivityLog`.

## Permisos sugeridos

```text
logs.activity.read
logs.audit.read
logs.errors.read
logs.errors.resolve
logs.events.read
logs.trace.read
logs.export
```

## Controller sugerido

```text
/api/v1/logs
```

## Endpoints mínimos

### Actividad de usuario

```http
GET /api/v1/logs/activity
GET /api/v1/logs/activity/{id}
```

Filtros:

```text
userId
module
action
succeeded
statusCode
dateFrom
dateTo
correlationId
operationId
referenceFolio
page
pageSize
```

### Auditoría

```http
GET /api/v1/logs/audit
GET /api/v1/logs/audit/{id}
GET /api/v1/logs/audit/entities/{entityName}/{entityId}
```

Filtros:

```text
userId
action
entityName
entityId
dateFrom
dateTo
operationId
transactionId
referenceFolio
```

### Errores

```http
GET /api/v1/logs/errors
GET /api/v1/logs/errors/{id}
POST /api/v1/logs/errors/{id}/resolve
POST /api/v1/logs/errors/{id}/reopen
```

Filtros:

```text
severity
errorCode
exceptionType
isResolved
fingerprint
dateFrom
dateTo
operationId
correlationId
eventId
referenceFolio
```

### Eventos

```http
GET /api/v1/logs/events
GET /api/v1/logs/events/{eventId}
```

Filtros:

```text
eventName
status
operationId
correlationId
causationId
referenceFolio
dateFrom
dateTo
```

### Línea de tiempo

```http
GET /api/v1/trace/operations/{operationId}
GET /api/v1/trace/correlations/{correlationId}
GET /api/v1/trace/documents/{folio}
GET /api/v1/trace/events/{eventId}
```

## Respuesta de línea de tiempo

```json
{
  "operationId": "01JY8A5N3Y87M5GH1YRQ9T1X8Q",
  "referenceFolio": "VTA-2026-000123",
  "startedAt": "2026-07-25T16:10:00Z",
  "completedAt": "2026-07-25T16:10:01Z",
  "status": "Succeeded",
  "items": [
    {
      "occurredAt": "2026-07-25T16:10:00Z",
      "type": "UserActivity",
      "action": "SALE_CONFIRM_REQUESTED",
      "succeeded": true
    },
    {
      "occurredAt": "2026-07-25T16:10:00Z",
      "type": "Audit",
      "action": "SALE_CONFIRMED",
      "entityName": "Sale",
      "entityId": "..."
    },
    {
      "occurredAt": "2026-07-25T16:10:00Z",
      "type": "InventoryMovement",
      "action": "SALE_OUT"
    },
    {
      "occurredAt": "2026-07-25T16:10:01Z",
      "type": "SystemEvent",
      "action": "SaleConfirmedDomainEvent",
      "status": "Processed"
    }
  ]
}
```

## Orden de la línea de tiempo

Ordenar por:

```text
occurredAt
sequenceNumber cuando exista
createdAt
id como desempate
```

## Exportación

Si se permite exportar:

- limitar rango;
- requerir permiso;
- registrar la exportación;
- enmascarar datos sensibles;
- generar archivo en proceso controlado;
- no permitir exportación masiva sin límites.

## Rendimiento

- usar proyecciones;
- usar `AsNoTracking`;
- limitar `pageSize`;
- evitar cargar JSON completo en listados;
- cargar `beforeData`, `afterData` y `stackTrace` solo en detalle;
- aplicar índices por `operationId`, `correlationId`, folio y fecha.
