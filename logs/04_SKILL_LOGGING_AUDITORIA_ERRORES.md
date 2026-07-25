---
name: Skill de logging, auditoría, errores y trazabilidad
applies_to: toda feature backend
---

# Skill de logging, auditoría, errores y trazabilidad

## Instrucción para el agente

Aplica esta skill en toda feature nueva o modificada.

## Reglas obligatorias

1. Toda petición relevante genera `UserActivityLog`.
2. Toda operación funcional tiene `operationId`.
3. Toda petición HTTP tiene `correlationId`.
4. Toda mutación crítica genera `AuditLog`.
5. Todo error técnico genera `SystemErrorLog`.
6. Todo Domain Event/Outbox genera o actualiza `SystemEventLog`.
7. Toda auditoría crítica se guarda dentro de la transacción de negocio.
8. Todo error se guarda en una transacción independiente después del rollback.
9. Los Controllers no escriben logs directamente.
10. No usar Minimal APIs.
11. No guardar secretos.
12. No capturar excepciones para silenciarlas.
13. La falla del writer de logs no debe sustituir la excepción original.
14. Todas las fechas se guardan en UTC mediante `DateTimeOffset`.
15. Toda consulta de logs requiere permiso administrativo específico.

## Interfaces requeridas

```csharp
public interface ICorrelationContext
{
    string CorrelationId { get; }
    string? TraceId { get; }
    string RequestId { get; }
}

public interface IOperationContext
{
    string OperationId { get; }
    string? ParentOperationId { get; }
    string? CausationId { get; }
}

public interface IUserActivityLogWriter
{
    Task WriteAsync(UserActivityLogEntry entry, CancellationToken cancellationToken);
}

public interface IAuditLogWriter
{
    Task WriteAsync(AuditLogEntry entry, CancellationToken cancellationToken);
}

public interface ISystemErrorLogWriter
{
    Task WriteAsync(SystemErrorLogEntry entry, CancellationToken cancellationToken);
}
```

## Patrón de request

```text
Request
  -> CorrelationIdMiddleware
  -> OperationContextMiddleware
  -> UserActivityLoggingMiddleware
  -> AuthN/AuthZ
  -> ControllerBase
  -> Vertical Slice Handler
  -> Domain
  -> EF Core
```

## Patrón de comando crítico

```text
Handler
  -> iniciar transacción
  -> cargar agregado
  -> validar reglas
  -> aplicar cambios
  -> generar InventoryMovement si aplica
  -> crear AuditLog semántico
  -> crear OutboxMessage
  -> SaveChanges
  -> commit
```

Todos comparten:

```text
operationId
correlationId
transactionId
referenceType
referenceId
referenceFolio
```

## Patrón de error

```text
try
  ejecutar operación
catch
  rollback
  persistir SystemErrorLog con LoggingDbContext
  rethrow o devolver ProblemDetails mediante IExceptionHandler
```

No intentar guardar el error dentro de la transacción fallida.

## Sanitización

El sanitizador debe ser centralizado y deny-by-default.

Claves prohibidas:

```text
password
passwordHash
currentPassword
newPassword
Authorization
JWT
accessToken
refreshToken
cookie
connectionString
apiKey
secret
CVV
```

## Auditoría semántica

No depender únicamente de `SaveChangesInterceptor`.

Ejemplo correcto:

```text
SALE_CONFIRMED
```

Ejemplo insuficiente:

```text
EntityModified
```

El interceptor puede complementar, no reemplazar, la intención del negocio.

## Checklist del agente

```text
[ ] operationId definido
[ ] correlationId propagado
[ ] transactionId generado
[ ] referencia funcional definida
[ ] ActivityLog implementado
[ ] AuditLog transaccional implementado
[ ] SystemErrorLog independiente implementado
[ ] SystemEventLog implementado si aplica
[ ] datos sensibles sanitizados
[ ] índices definidos
[ ] migración Code First creada
[ ] pruebas agregadas
[ ] endpoint de consulta protegido
[ ] ControllerBase utilizado
[ ] ninguna Minimal API
```
