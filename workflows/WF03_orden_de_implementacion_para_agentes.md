---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# WF03 - Orden de implementación para agentes

## Sprint 0 - Base técnica

Crear solución y proyectos:

```bash
dotnet new sln -n Distribuidora
dotnet new webapi -n Distribuidora.Api
dotnet new classlib -n Distribuidora.Application
dotnet new classlib -n Distribuidora.Domain
dotnet new classlib -n Distribuidora.Infrastructure
dotnet new classlib -n Distribuidora.Contracts
dotnet new xunit -n Distribuidora.UnitTests
dotnet new xunit -n Distribuidora.IntegrationTests
```

Configurar referencias respetando Clean Architecture.

## Sprint 1

1. M01 Seguridad.
2. M02 Catálogos.

## Sprint 2

3. M03 Inventario.

## Sprint 3

4. M04 Compras y recepción.

## Sprint 4

5. M05 Ventas por mostrador.

## Sprint 5

6. M06 Cobranza.
7. M07 Auditoría.

## Sprint 6

8. M08 Reportes.
9. M09 Administración.

## Regla de bloqueo

No implementar ventas antes de tener inventario transaccional y catálogos funcionales.

No implementar cobranza antes de tener ventas confirmables.

No implementar reportes antes de que existan datos reales de compras, inventario y ventas.
