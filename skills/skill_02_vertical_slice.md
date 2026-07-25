---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# Skill 02 - Vertical Slice

## Objetivo

Organizar el código por caso de uso y no por carpetas técnicas gigantes.

## Estructura sugerida

```text
Application/Features/CounterSales/ConfirmCounterSale/
  ConfirmCounterSaleCommand.cs
  ConfirmCounterSaleValidator.cs
  ConfirmCounterSaleHandler.cs
  ConfirmCounterSaleResponse.cs
```

## Reglas

- Cada slice debe tener request, validator, handler y response si aplica.
- El handler coordina repositorios, políticas y eventos.
- La lógica pura vive en Domain.
- Las consultas de reporte pueden usar query services optimizados.
- No compartir handlers genéricos para operaciones con reglas distintas.

## Contrato para endpoints

Endpoint -> Command/Query -> Handler -> Domain/Repositories -> Response.

## Pruebas

- Unit tests para Domain.
- Handler tests con dependencias mockeadas cuando convenga.
- Integration tests para endpoints críticos.
