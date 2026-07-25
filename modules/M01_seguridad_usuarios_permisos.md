---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# M01 - Seguridad, usuarios y permisos

## Prompt para agente

```text
Eres un agente senior de backend .NET especializado en seguridad. Implementa autenticación, autorización, usuarios, roles, permisos y auditoría base para el MVP de ventas por mostrador. Usa JWT, refresh tokens, Clean Architecture, Vertical Slice, Domain Events y EF Core Code First con PostgreSQL. No implementes frontend ni procesos fuera del mostrador.
```

## Fase

Sprint 1

## Dependencias

```text
Sprint 0 - solución base y paquetes comunes
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

Controlar quién accede al sistema, qué acciones puede ejecutar y dejar evidencia de operaciones críticas.

## Alcance mínimo

Implementar autenticación, refresh tokens, roles, permisos granulares, usuarios activos/inactivos y auditoría inicial. Este módulo no administra inventario ni ventas.

## Entidades / tablas mínimas

- User: Id, name, username, email, passwordHash, active, lastAccessAt
- Role: Id, name, description, active
- Permission: key, module, action, description
- UserRole: UserId, RoleId
- RolePermission: RoleId, PermissionKey
- RefreshToken: tokenHash, UserId, expiresAt, revokedAt, createdByIp
- AuditLog: userId, action, entityName, entityId, beforeData, afterData, ipAddress, correlationId, createdAt

## Endpoints mínimos

- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- GET /api/users
- POST /api/users
- PUT /api/users/{id}
- PUT /api/users/{id}/roles
- GET /api/roles
- POST /api/roles
- PUT /api/roles/{id}/permissions
- GET /api/permissions

## Reglas de negocio

- Los permisos se definen por módulo y acción.
- Operaciones críticas requieren permiso explícito.
- No compartir usuarios entre empleados.
- No eliminar usuarios con actividad; solo desactivar.
- Registrar auditoría en altas, cambios, cancelaciones, ajustes y operaciones financieras.

## Validaciones mínimas

- Username/email único.
- Contraseña con política mínima configurable.
- No permitir dejar el sistema sin administrador activo.
- No asignar permisos inexistentes.
- No permitir refresh token revocado o expirado.

## Domain Events sugeridos

- UserCreatedDomainEvent
- UserDeactivatedDomainEvent
- RolePermissionsChangedDomainEvent
- UserLoggedInDomainEvent
- SecurityAuditWrittenDomainEvent

## Vertical slices sugeridos

- Login
- RefreshToken
- Logout
- CreateUser
- UpdateUser
- AssignUserRoles
- CreateRole
- AssignRolePermissions
- GetPermissions

## Persistencia EF Core / PostgreSQL

- Crear configuraciones con `IEntityTypeConfiguration<T>`.
- Usar claves primarias `Guid` o `Ulid` de forma consistente.
- Definir índices únicos en claves naturales como folio, SKU, código de barras, email o RFC cuando aplique.
- Usar `numeric(18,2)` para dinero y `numeric(18,4)` para cantidades.
- Agregar campos auditables.
- Usar `RowVersion` o token de concurrencia en documentos críticos y balances.
- Incluir migración con nombre: `AddSecurityUsersRolesPermissions`.

## Seguridad y permisos

- Permisos: security.view, security.create_user, security.edit_user, security.manage_roles.
- Passwords hasheadas con algoritmo seguro.
- Nunca regresar passwordHash en responses.
- Swagger debe poder autorizar con JWT.

## Pruebas mínimas

- login correcto devuelve JWT y refresh token
- login incorrecto falla sin exponer detalle sensible
- usuario desactivado no inicia sesión
- usuario sin permiso no ejecuta endpoint protegido
- auditoría se crea en operación crítica

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
