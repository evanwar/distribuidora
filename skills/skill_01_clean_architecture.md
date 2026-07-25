---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# Skill 01 - Clean Architecture para este backend

## Objetivo

Mantener separación clara entre dominio, aplicación, infraestructura y API.

## Reglas

- `Domain` no depende de ningún otro proyecto.
- `Application` depende de `Domain` y `Contracts`.
- `Infrastructure` implementa interfaces de `Application`.
- `Api` solo expone endpoints y compone dependencias.
- No poner reglas de negocio en controllers, endpoints o configuraciones EF.
- No meter EF Core en entidades de dominio.
- No usar DTOs de API dentro de entidades.

## Patrón de agregado

Cada agregado debe proteger sus invariantes mediante métodos:

```csharp
sale.Confirm(stockValidation, paymentPolicy);
sale.Cancel(reason, userId, clock.UtcNow);
```

Evitar setters públicos para propiedades críticas.

## Resultado esperado

El código debe ser testeable sin base de datos para reglas puras y verificable con integración para persistencia.
