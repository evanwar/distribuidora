---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# Skill 05 - API, validación y seguridad

## Objetivo

Estandarizar endpoints, errores, validaciones, permisos y Swagger.

## API

- Usar exclusivamente ASP.NET Core MVC Controllers basados en `ControllerBase`. Minimal APIs están prohibidas.
- Versionar API si se prevé crecimiento: `/api/v1/...`.
- Responder con contrato estándar.
- Usar `ProblemDetails` para errores si se adapta al contrato.

## Validación

- FluentValidation por command/query.
- Validar datos antes de ejecutar transacción.
- Validar reglas de negocio dentro de Domain/Application.

## Seguridad

- JWT obligatorio en endpoints de escritura.
- Permisos granulares por acción.
- Nunca exponer tokens, passwordHash o secretos.
- Auditar acciones críticas.

## Swagger

Cada endpoint debe documentar:

- Descripción.
- Permiso requerido.
- Request example.
- Response example.
- Errores comunes.

## Errores comunes

```text
400 - Validación de request
401 - No autenticado
403 - Sin permiso
404 - Recurso no encontrado
409 - Conflicto de negocio o concurrencia
422 - Regla de negocio no cumplida
```
