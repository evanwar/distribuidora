---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# 02 - Arquitectura global backend

## Estilo de arquitectura

Usar **monolito modular** con proyectos separados por responsabilidad y Vertical Slice dentro de Application/API.

No crear microservicios al inicio.

## Proyectos de clase

```text
Distribuidora.Api
Distribuidora.Application
Distribuidora.Domain
Distribuidora.Infrastructure
Distribuidora.Contracts
Distribuidora.UnitTests
Distribuidora.IntegrationTests
```

## Dependencias permitidas

```text
Api -> Application, Contracts
Application -> Domain, Contracts
Infrastructure -> Application, Domain
Contracts -> sin dependencias internas
Domain -> sin dependencias internas de otros proyectos
Tests -> proyectos necesarios según tipo de prueba
```

## Dependencias prohibidas

```text
Domain -> Infrastructure
Domain -> Application
Application -> Infrastructure
Contracts -> Infrastructure
Api -> Infrastructure directo para reglas de negocio
```

`Api` puede referenciar `Infrastructure` solo para composición de dependencias en `Program.cs` usando métodos de extensión como `AddInfrastructure()`.

## Vertical Slice

Cada caso de uso debe agruparse por feature:

```text
Application/Features/CounterSales/CreateCounterSale/
  CreateCounterSaleCommand.cs
  CreateCounterSaleValidator.cs
  CreateCounterSaleHandler.cs
  CreateCounterSaleResponse.cs
```

El patrón aplica para Commands y Queries.

## Dominio

El proyecto `Domain` contiene:

- Entidades.
- Agregados.
- Value Objects.
- Enums.
- Domain Events.
- Reglas puras.
- Métodos que mantienen invariantes.

No debe contener EF Core, Dapper, HTTP, Swagger, JWT ni dependencias externas.

## Application

El proyecto `Application` contiene:

- Casos de uso.
- DTOs internos.
- Validadores.
- Interfaces de repositorio.
- Interfaces de servicios.
- Manejadores de eventos.
- Reglas de orquestación.

## Infrastructure

El proyecto `Infrastructure` contiene:

- EF Core.
- PostgreSQL/Npgsql.
- Configuraciones de entidades.
- Migraciones.
- Implementaciones de repositorio.
- Implementación de Unit of Work.
- Outbox de Domain Events.
- Servicios externos técnicos.

## API

El proyecto `Api` contiene:

- ASP.NET Core MVC Controllers basados en `ControllerBase`.
- Autenticación y autorización.
- Swagger.
- Middlewares.
- Manejo de errores.
- Inyección de dependencias.

El API no debe calcular inventario, totales, créditos o cancelaciones.

## Domain Events

Usar Domain Events para comunicar hechos de negocio dentro del monolito:

```text
ProductCreatedDomainEvent
GoodsReceiptClosedDomainEvent
InventoryMovementCreatedDomainEvent
CounterSaleConfirmedDomainEvent
PaymentRegisteredDomainEvent
AccountReceivableCreatedDomainEvent
InventoryAdjustmentConfirmedDomainEvent
```

Para el MVP, los eventos pueden procesarse dentro de la misma transacción cuando sean parte del mismo agregado o con Outbox cuando generen efectos posteriores.

## Persistencia

- Base de datos: PostgreSQL.
- ORM: EF Core.
- Provider: Npgsql.
- Migraciones Code First.
- Configuración por `IEntityTypeConfiguration<T>`.
- Convención de dinero: `numeric(18,2)`.
- Convención de cantidades: `numeric(18,4)`.
- Fechas: `timestamptz` para auditoría y eventos.

## Nombres sugeridos de esquemas PostgreSQL

```text
security
catalogs
inventory
purchases
sales
receivables
audit
admin
```

Si se prefiere simplicidad al inicio, puede usarse `public`, pero las configuraciones deben quedar listas para separar por schema.
