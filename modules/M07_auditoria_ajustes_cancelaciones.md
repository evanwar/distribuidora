---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# M07 - Auditoría, ajustes y cancelaciones

## Prompt para agente

```text
Eres un agente senior de backend .NET especializado en auditoría operativa. Implementa bitácora, trazabilidad, consultas de acciones críticas, motivos de cancelación y soporte transversal para ajustes del MVP de mostrador. No implementes control operativo de reparto.
```

## Fase

Sprint 5

## Dependencias

```text
M01
M02
M03
M04
M05
```

## Skills obligatorias

```text
../skills/skill_01_clean_architecture.md
../skills/skill_02_vertical_slice.md
../skills/skill_03_domain_events.md
../skills/skill_04_efcore_postgresql_codefirst.md
../skills/skill_05_api_validation_security.md
../skills/skill_06_testing_acceptance.md
../skills/skill_07_inventory_consistency.md
../skills/skill_08_counter_sales_consistency.md
```

## Objetivo

Asegurar trazabilidad completa de operaciones críticas: inventario, compras, ventas, pagos, ajustes y cancelaciones.

## Alcance mínimo

Implementar auditoría consultable, captura de motivos, eventos de auditoría, filtros por usuario/fecha/entidad y registros de datos antes/después cuando aplique.

## Entidades / tablas mínimas

- AuditLog: userId, action, module, entityName, entityId, beforeData, afterData, ipAddress, correlationId, createdAt
- CancellationReason: code, description, module, requiresAuthorization, active
- OperationalNote: entityName, entityId, note, createdBy, createdAt
- SystemEventLog: eventName, payload, processedAt, status, error

## Endpoints mínimos

- GET /api/audit/logs
- GET /api/audit/logs/{id}
- GET /api/audit/by-entity
- GET /api/cancellation-reasons
- POST /api/cancellation-reasons
- PUT /api/cancellation-reasons/{id}
- POST /api/operational-notes

## Reglas de negocio

- Toda cancelación requiere motivo.
- Auditoría crítica no se edita ni elimina.
- Datos sensibles deben omitirse o enmascararse.
- Acciones deben guardar correlationId.
- Cada documento cancelado debe conservar usuario, fecha y motivo.
- Los ajustes de inventario deben poder rastrearse desde auditoría y kardex.

## Validaciones mínimas

- Rango de fechas requerido en consultas grandes.
- No permitir borrar AuditLog.
- No aceptar motivo vacío en cancelaciones.
- No permitir modificar motivo usado históricamente; solo desactivar.
- Validar permiso para consultar auditoría.

## Domain Events sugeridos

- AuditLogWrittenDomainEvent
- EntityCancelledDomainEvent
- CancellationReasonCreatedDomainEvent
- OperationalNoteAddedDomainEvent

## Vertical slices sugeridos

- GetAuditLogs
- GetAuditByEntity
- CreateCancellationReason
- UpdateCancellationReason
- AddOperationalNote
- GetSystemEvents

## Persistencia EF Core / PostgreSQL

- Crear configuraciones con `IEntityTypeConfiguration<T>`.
- Usar claves primarias `Guid` o `Ulid` de forma consistente.
- Definir índices únicos en claves naturales como folio, SKU, código de barras, email o RFC cuando aplique.
- Usar `numeric(18,2)` para dinero y `numeric(18,4)` para cantidades.
- Agregar campos auditables.
- Usar `RowVersion` o token de concurrencia en documentos críticos y balances.
- Incluir migración con nombre: `AddAuditCancellationAndOperationalNotes`.

## Seguridad y permisos

- Permisos: audit.view, audit.export, admin.manage_cancellation_reasons.
- Enmascarar passwordHash, tokens y secretos.
- Auditoría no debe revelar información sensible innecesaria.

## Pruebas mínimas

- cancelación sin motivo falla
- audit log no se elimina
- consulta por entidad retorna acciones
- datos sensibles se enmascaran
- motivo histórico no se modifica destructivamente

## Criterios de aceptación

- El módulo compila sin dependencias circulares.
- Los endpoints aparecen en Swagger.
- Las reglas de negocio están en Domain/Application, no en Api.
- Las migraciones aplican en PostgreSQL.
- Las pruebas unitarias y de integración del módulo pasan.
- El módulo no rompe reglas globales de inventario, auditoría ni seguridad.
- El módulo no introduce dependencias fuera del alcance de ventas por mostrador.

## Checklist para el agente antes de terminar

```text
[ ] Código compila
[ ] Migración EF Core creada
[ ] Seeds agregados si aplican
[ ] Endpoints documentados
[ ] Validadores creados
[ ] Permisos definidos
[ ] Auditoría considerada
[ ] Domain events levantados
[ ] Tests unitarios agregados
[ ] Tests de integración agregados
[ ] README/notas técnicas actualizadas si aplica
```
