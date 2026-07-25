---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# Prompts backend para agentes - MVP Ventas por Mostrador

Este paquete contiene prompts `.MD` para construir un backend en .NET siguiendo una arquitectura monolítica modular, separada por proyectos de clase y orientada a Vertical Slice.

## Alcance actual

El alcance queda reducido a **ventas por mostrador**. Los procesos de distribución en ruta, almacenes móviles, choferes, cargas de ruta, liquidaciones de choferes y control de camionetas quedan fuera del MVP actual.

## Objetivo del MVP

Construir un backend capaz de operar un negocio de mostrador con:

- Seguridad, usuarios y permisos.
- Catálogos base.
- Inventario central y kardex.
- Compras y recepción de mercancía.
- Ventas por mostrador.
- Pagos y cuentas por cobrar básicas.
- Auditoría operativa.
- Reportes backend mínimos.
- Administración y configuración.

## Cómo usar estos prompts con agentes

1. Inicia con `00_ORQUESTADOR.md`.
2. Lee `01_CONTEXTO_NEGOCIO_Y_ALCANCE.md`.
3. Aplica `02_ARQUITECTURA_GLOBAL.md` y `03_CONVENCIONES_TRANSVERSALES.md`.
4. Antes de implementar cada módulo, lee todas las skills indicadas en el módulo.
5. Ejecuta los módulos en el orden indicado por el orquestador.
6. Cada agente debe entregar código, migraciones, pruebas y documentación Swagger.

## Archivos principales

```text
00_ORQUESTADOR.md
01_CONTEXTO_NEGOCIO_Y_ALCANCE.md
02_ARQUITECTURA_GLOBAL.md
03_CONVENCIONES_TRANSVERSALES.md
MANIFEST.md
modules/
skills/
workflows/
```

## Regla principal

Ningún material debe entrar, salir, venderse, devolverse, ajustarse o cancelarse sin un movimiento trazable en inventario y auditoría.

## Implementación disponible

La solución ejecutable se encuentra en `Distribuidora.slnx` y usa .NET 8, ASP.NET Core MVC Controllers, EF Core 8, Npgsql, PostgreSQL, JWT y Swagger.

```bash
dotnet restore
dotnet build Distribuidora.slnx
dotnet test Distribuidora.slnx
dotnet tool restore
dotnet tool run dotnet-ef database update \
  --project src/Distribuidora.Infrastructure \
  --startup-project src/Distribuidora.Api
dotnet run --project src/Distribuidora.Api
```

Swagger queda disponible en `/swagger`. La migración automática está desactivada por defecto. Para un ambiente local controlado puede habilitarse con `Database__AutoMigrate=true`.

Antes de iniciar en cualquier ambiente:

- Reemplazar `ConnectionStrings__Default`.
- Configurar `Jwt__Key` con un secreto de al menos 32 bytes.
- Configurar `Seed__AdminPassword`; el valor de desarrollo debe cambiarse inmediatamente.
- Mantener migraciones controladas por el proceso de despliegue en producción.

La descripción técnica completa está en `IMPLEMENTATION.md`.

## Organización por funcionalidad

El código HTTP y de aplicación se organiza por tópico de negocio. Para dar
mantenimiento a una funcionalidad, comenzar por la carpeta con su nombre:

```text
src/
  Distribuidora.Api/Features/
    Customers/       # endpoints /api/v1/customers
    Suppliers/       # endpoints /api/v1/suppliers
    Products/
    Warehouses/
    Inventory/
    Purchases/
    Sales/
    Receivables/
  Distribuidora.Application/Features/
    Customers/       # casos de uso y reglas de clientes
    Suppliers/       # casos de uso y reglas de proveedores
    Products/
    Warehouses/
  Distribuidora.Contracts/
    Requests/<Feature>/
    Responses/<Feature>/
  Distribuidora.Domain/Catalogs/
    Customers/
    Suppliers/
    Products/
    Warehouses/
  Distribuidora.Infrastructure/Persistence/Configurations/
    Customers/
    Suppliers/
    Products/
    Warehouses/
```

Las carpetas son feature-first, pero los contratos HTTP, nombres de tablas y
esquemas de PostgreSQL se mantienen estables.

## Ejecución con Docker

El stack incluye el API y PostgreSQL 16. La base de datos usa el volumen nombrado
`distribuidora_postgres_data`, por lo que sus datos sobreviven a `docker compose stop`,
reinicios y `docker compose down`.

```bash
cp .env.example .env
# Editar .env y reemplazar contraseñas y JWT_KEY.
docker compose up --build -d
docker compose ps
```

En PowerShell, usar `Copy-Item .env.example .env` en lugar de `cp`.

Servicios locales:

- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger`
- Salud: `http://localhost:8080/api/v1/health`
- PostgreSQL: `localhost:5432`

El API espera a que PostgreSQL esté saludable y luego ejecuta las migraciones y el
seed inicial mediante `Database__AutoMigrate=true`. Dentro de la red Docker, el API
se conecta a `postgres:5432`; no utiliza `localhost`.

Comandos de operación:

```bash
docker compose logs -f api
docker compose stop
docker compose start
docker compose down
```

`docker compose down` conserva los datos. El volumen solamente se elimina de forma
explícita con `docker compose down --volumes`; este comando borra la base de datos.
