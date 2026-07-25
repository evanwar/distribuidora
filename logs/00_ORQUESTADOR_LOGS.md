---
name: Orquestador de logs, auditoría y trazabilidad
project: Distribuidora Backend - MVP Mostrador
stack: .NET 8+, ASP.NET Core Controllers, EF Core Code First, PostgreSQL
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only
---

# Orquestador de logs, auditoría y trazabilidad

## Objetivo

Guiar a los agentes para implementar de forma coherente y obligatoria:

1. Actividad de usuario.
2. Auditoría de cambios de negocio.
3. Registro de errores técnicos.
4. Seguimiento de Domain Events y Outbox.
5. Trazabilidad completa por `operationId`, `correlationId`, `traceId`, `transactionId`, `eventId` y `causationId`.
6. Persistencia primaria en PostgreSQL.

## Archivos obligatorios

Antes de implementar o modificar una feature, el agente debe leer:

```text
01_OBSERVABILIDAD_AUDITORIA_Y_LOGS_BD.md
02_TRAZABILIDAD_TRANSACCIONAL_E_IDENTIFICADORES.md
03_MODELO_DATOS_LOGS_POSTGRESQL.md
04_SKILL_LOGGING_AUDITORIA_ERRORES.md
06_SEGURIDAD_RETENCION_Y_DATOS_SENSIBLES.md
07_PRUEBAS_Y_CRITERIOS_ACEPTACION_LOGS.md
```

Para implementar consultas administrativas también debe leer:

```text
05_CONSULTAS_Y_ENDPOINTS_TRAZABILIDAD.md
```

## Reglas no negociables

1. PostgreSQL es el destino primario obligatorio.
2. No usar archivos locales, consola o proveedores externos como único repositorio.
3. Toda solicitud relevante debe tener `correlationId`.
4. Toda operación de negocio debe tener `operationId`.
5. Toda mutación crítica debe generar auditoría dentro de la misma transacción de negocio.
6. Todo movimiento de inventario debe compartir el `operationId` de la operación que lo originó.
7. Los errores deben persistirse en una transacción independiente después del rollback.
8. Los Controllers no deben escribir logs directamente.
9. Los Controllers deben heredar de `ControllerBase`; no usar Minimal APIs.
10. No registrar contraseñas, tokens, cookies, credenciales ni cuerpos completos sensibles.
11. La falla del logging no debe ocultar la excepción original.
12. Una operación confirmada debe poder reconstruirse como línea de tiempo.

## Flujo de implementación por feature

### Paso 1. Clasificar la operación

Determinar si la feature es:

```text
Query
Command
Command crítico
Proceso asíncrono
Domain Event
Outbox Consumer
```

### Paso 2. Definir identificadores

Toda petición:

```text
correlationId
traceId
requestId
```

Toda operación de negocio:

```text
operationId
referenceType
referenceId
referenceFolio
```

Cuando exista encadenamiento:

```text
eventId
causationId
```

Cuando exista transacción:

```text
transactionId
```

### Paso 3. Definir registros necesarios

| Tipo de acción | UserActivityLog | AuditLog | SystemErrorLog | SystemEventLog |
|---|---:|---:|---:|---:|
| Consulta exitosa | Sí | No | No | No |
| Comando exitoso no crítico | Sí | Opcional | No | Opcional |
| Comando crítico | Sí | Sí | No | Sí si genera evento |
| Validación de negocio | Sí | No | No | No |
| Acceso denegado | Sí | No | No | No |
| Excepción técnica | Sí | No si hubo rollback | Sí | Sí si ocurrió procesando evento |
| Evento procesado | No necesariamente | No | No | Sí |
| Evento fallido | No necesariamente | No | Sí | Sí |

### Paso 4. Diseñar la transacción

El agente debe declarar explícitamente:

- qué registros forman parte de la transacción principal;
- qué auditorías se guardan dentro de esa transacción;
- qué errores se guardan fuera de ella;
- qué mensajes Outbox se guardan atómicamente;
- qué identificadores comparten todos los registros.

### Paso 5. Implementar por capa

```text
Domain
  Domain Events
  conceptos de negocio
  identificadores de operación cuando formen parte del agregado

Application
  interfaces
  behaviors
  handlers
  DTOs
  queries administrativas

Infrastructure
  EF Core
  interceptors
  writers PostgreSQL
  sanitización
  Outbox
  LoggingDbContext

Api
  middlewares
  IExceptionHandler
  Controllers de consulta
  ProblemDetails
```

### Paso 6. Validar Definition of Done

No cerrar una feature si falta cualquiera de estos puntos:

```text
[ ] correlationId propagado
[ ] operationId propagado
[ ] auditoría crítica transaccional
[ ] error técnico persistido fuera de la transacción fallida
[ ] datos sensibles sanitizados
[ ] migración EF Core
[ ] índices
[ ] pruebas unitarias
[ ] pruebas de integración
[ ] endpoint administrativo protegido cuando aplique
[ ] sin Minimal APIs
```

## Resultado esperado del agente

Cada implementación debe entregar:

1. Decisión de trazabilidad.
2. Entidades o cambios de esquema.
3. Configuraciones EF Core.
4. Migración Code First.
5. Middlewares, interceptors o writers necesarios.
6. Pruebas.
7. Documentación OpenAPI de consultas administrativas.
8. Evidencia de que una operación puede reconstruirse por `operationId`.
