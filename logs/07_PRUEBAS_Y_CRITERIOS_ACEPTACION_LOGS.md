# Pruebas y criterios de aceptación de logs

## Pruebas unitarias

### Correlation context

```text
[ ] conserva header válido
[ ] genera valor cuando no existe
[ ] rechaza valores demasiado largos
[ ] agrega header de respuesta
```

### Operation context

```text
[ ] genera operationId para comando inicial
[ ] conserva operationId en reintento idempotente
[ ] propaga parentOperationId
[ ] propaga causationId
```

### Sanitizador

```text
[ ] elimina password
[ ] elimina Authorization
[ ] elimina tokens
[ ] trunca strings
[ ] limita profundidad JSON
[ ] no serializa entidades completas
```

### Fingerprint de errores

```text
[ ] mismo tipo y origen producen fingerprint estable
[ ] datos variables no alteran el fingerprint
[ ] excepciones diferentes no colisionan fácilmente
```

## Pruebas de integración

### Actividad exitosa

Dado un usuario autenticado, cuando consulta productos:

```text
[ ] se crea UserActivityLog
[ ] contiene userId
[ ] contiene route template
[ ] contiene status 200
[ ] contiene durationMs
[ ] contiene correlationId
[ ] contiene operationId
```

### Comando crítico exitoso

Al confirmar una venta:

```text
[ ] se guarda Sale
[ ] se guardan detalles
[ ] se registra pago si aplica
[ ] se crea InventoryMovement
[ ] se actualiza StockBalance
[ ] se crea AuditLog
[ ] se crea OutboxMessage
[ ] todos comparten operationId
[ ] los cambios transaccionales comparten transactionId
```

### Rollback

Forzar un error antes del commit:

```text
[ ] no queda venta parcial
[ ] no queda movimiento parcial
[ ] no queda auditoría crítica huérfana
[ ] no queda Outbox huérfano
[ ] se persiste SystemErrorLog en transacción independiente
[ ] el error conserva operationId y correlationId
```

### Error del logging

Forzar fallo del `LoggingDbContext`:

```text
[ ] no se reemplaza la excepción original
[ ] existe fallback estructurado
[ ] no se produce recursión
[ ] la respuesta conserva correlationId
```

### Acceso denegado

```text
[ ] responde 403
[ ] genera UserActivityLog
[ ] no genera SystemErrorLog
[ ] registra permiso requerido
```

### Validación de negocio

```text
[ ] responde 400/409/422 según contrato
[ ] genera UserActivityLog
[ ] no genera SystemErrorLog salvo anomalía técnica
```

### Domain Event

```text
[ ] Outbox guarda eventId
[ ] SystemEventLog conserva operationId
[ ] causationId relaciona eventos
[ ] un reintento incrementa attemptCount
[ ] un fallo genera SystemErrorLog
```

## Pruebas de endpoints administrativos

```text
[ ] usuario sin permiso recibe 403
[ ] filtros funcionan
[ ] paginación obligatoria
[ ] detalles sensibles no aparecen en listado
[ ] stackTrace solo aparece con permiso
[ ] consulta administrativa genera UserActivityLog
[ ] timeline por operationId ordena correctamente
[ ] búsqueda por folio encuentra toda la operación
```

## Criterios de aceptación

La implementación se acepta cuando:

1. Una venta puede reconstruirse por `operationId`.
2. Una petición puede reconstruirse por `correlationId`.
3. Los cambios confirmados pueden agruparse por `transactionId`.
4. Los eventos pueden encadenarse por `eventId` y `causationId`.
5. Un rollback no deja datos parciales.
6. El error técnico sobrevive al rollback.
7. No se almacenan secretos.
8. Los logs son consultables mediante Controllers protegidos.
9. Las migraciones se generan con EF Core Code First.
10. No existen Minimal APIs.
