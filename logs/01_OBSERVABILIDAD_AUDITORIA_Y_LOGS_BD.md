---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API Controllers, .NET 8+, EF Core, PostgreSQL, Npgsql
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only
---

# Observabilidad, actividad de usuario, auditoría y errores en PostgreSQL

## Propósito

Registrar en PostgreSQL:

1. La actividad relevante realizada por usuarios.
2. Los cambios críticos de negocio.
3. Los errores técnicos del sistema.
4. El procesamiento de Domain Events y Outbox.
5. La relación entre peticiones, operaciones, transacciones, documentos, entidades y eventos.

La consola, archivos locales o plataformas externas pueden funcionar como respaldo, pero PostgreSQL será el repositorio primario y consultable.

## Tipos de registros

| Registro | Responsabilidad |
|---|---|
| `UserActivityLog` | Registrar qué intentó hacer el usuario y cuál fue el resultado HTTP. |
| `AuditLog` | Registrar cambios de negocio con semántica, entidad y before/after. |
| `SystemErrorLog` | Registrar excepciones y fallos técnicos. |
| `SystemEventLog` | Registrar publicación, procesamiento, reintentos y fallos de Domain Events/Outbox. |

No deben mezclarse.

## Actividad de usuario

Registrar:

- login exitoso;
- login fallido;
- refresh token;
- logout;
- acceso denegado;
- consultas relevantes;
- altas;
- modificaciones;
- confirmaciones;
- cancelaciones;
- ajustes;
- cambios de configuración;
- exportaciones;
- consultas administrativas de auditoría.

Se pueden excluir expresamente:

```text
/health
/metrics
archivos estáticos
recursos internos de Swagger
```

## Auditoría de negocio

Toda operación crítica debe generar un registro semántico, por ejemplo:

```text
PRODUCT_PRICE_CHANGED
SALE_CREATED
SALE_CONFIRMED
SALE_CANCELLED
PAYMENT_REGISTERED
INVENTORY_ADJUSTED
GOODS_RECEIPT_CLOSED
CREDIT_LIMIT_CHANGED
USER_ROLE_CHANGED
```

El registro debe incluir:

- actor;
- fecha;
- módulo;
- acción;
- entidad;
- valores anteriores;
- valores posteriores;
- propiedades modificadas;
- razón cuando aplique;
- `operationId`;
- `correlationId`;
- `transactionId`;
- referencia y folio del documento.

## Errores técnicos

Registrar:

- excepciones no controladas;
- errores de PostgreSQL;
- errores de concurrencia;
- timeouts;
- fallos de integraciones;
- fallos de serialización;
- fallos de publicación o consumo de Outbox;
- errores inesperados del pipeline;
- errores de configuración en runtime.

No registrar como error técnico una validación normal de negocio, salvo que evidencie una anomalía.

## Componentes por capa

### Domain

```text
Domain Events
Identificadores de documentos
Reglas de negocio
```

El dominio no depende de infraestructura de logging.

### Application

Definir:

```text
ICurrentUser
ICorrelationContext
IOperationContext
IRequestMetadataAccessor
IUserActivityLogWriter
IAuditLogWriter
ISystemErrorLogWriter
ISystemEventLogWriter
ISensitiveDataSanitizer
IClock
```

### Infrastructure

Implementar:

```text
PostgresUserActivityLogWriter
PostgresAuditLogWriter
PostgresSystemErrorLogWriter
PostgresSystemEventLogWriter
AuditSaveChangesInterceptor
SensitiveDataSanitizer
LoggingDbContext
OutboxProcessor
```

### API

Pipeline recomendado:

```text
CorrelationIdMiddleware
OperationContextMiddleware
RequestMetadataMiddleware
UserActivityLoggingMiddleware
Authentication
Authorization
Controller MVC
GlobalExceptionHandler
```

No usar Minimal APIs.

## Principio de persistencia

### Dentro de la transacción principal

Guardar atómicamente:

```text
entidad de negocio
detalles
movimientos de inventario
saldos
pagos
AuditLog crítico
OutboxMessage
```

### Fuera de la transacción principal

Guardar en operación corta e independiente:

```text
SystemErrorLog
UserActivityLog final
errores del procesador Outbox
fallback técnico
```

## ProblemDetails

Toda excepción técnica debe responder mediante `ProblemDetails` sanitizado.

Campos públicos permitidos:

```json
{
  "type": "https://errors.example.com/internal-error",
  "title": "Ocurrió un error al procesar la solicitud.",
  "status": 500,
  "errorCode": "UNEXPECTED_ERROR",
  "correlationId": "...",
  "operationId": "..."
}
```

Nunca devolver:

- stack trace;
- cadenas de conexión;
- SQL;
- nombres internos sensibles;
- credenciales;
- detalles de infraestructura.

## Concurrencia

Cuando ocurra `DbUpdateConcurrencyException`:

1. hacer rollback;
2. registrar `SystemErrorLog` si es una falla técnica;
3. registrar actividad con resultado conflicto;
4. responder `409 Conflict`;
5. conservar `operationId` y `correlationId`.

## Disponibilidad

Si PostgreSQL no está disponible:

1. preservar la excepción original;
2. intentar fallback estructurado a consola o archivo temporal;
3. no fingir que el error fue persistido;
4. emitir métrica o alerta;
5. nunca iniciar recursión infinita de logging.

PostgreSQL sigue siendo el destino primario, pero no puede garantizarse persistencia en la misma base cuando ésta se encuentra caída.
