---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# Skill 06 - Testing y criterios de aceptación

## Objetivo

Asegurar que cada módulo funcione y no rompa reglas críticas.

## Tipos de prueba

### Unitarias

- Entidades y value objects.
- Reglas de dominio.
- Cálculo de totales.
- Estados de documentos.

### Integración

- Endpoints críticos.
- EF Core + PostgreSQL o Testcontainers.
- Transacciones de inventario.
- Autorización.

## Reglas mínimas

- Cada módulo debe agregar pruebas.
- Cada bug corregido debe agregar prueba.
- No avanzar si falla `dotnet test`.
- Probar casos felices y errores de negocio.

## Casos críticos globales

- No permite stock negativo sin permiso.
- Venta confirmada descuenta inventario.
- Cancelación revierte inventario.
- Recepción cerrada aumenta inventario.
- Pago reduce saldo.
- Documento confirmado no se edita.
