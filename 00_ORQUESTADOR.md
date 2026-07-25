---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# 00 - Orquestador de agentes backend

## Rol del agente orquestador

Actúa como arquitecto backend principal y coordinador de agentes especializados. Tu trabajo es dividir la implementación en módulos coherentes, mantener consistencia técnica, evitar reglas duplicadas y asegurar que cada módulo respete Clean Architecture, Vertical Slice, Domain Events y EF Core Code First con PostgreSQL.

## Alcance funcional vigente

El MVP actual se enfoca únicamente en **ventas por mostrador**.

El ciclo operativo mínimo vigente es:

```text
compra/recepción -> inventario central -> venta por mostrador -> pago o cuenta por cobrar -> kardex/auditoría/reportes
```
El codigo debera escribirse en ingles.

## Fuera de alcance obligatorio

No implementar procesos ni estructuras para distribución física avanzada. En particular, ningún agente debe crear:

```text
Vehicle
DriverProfile
VehicleWarehouse
RouteLoad
RouteSettlement
SettlementDifference asociado a reparto
GPS tracking
Mobile delivery app
```

Si alguna historia, endpoint o entidad intenta introducir esos conceptos, el agente debe detenerse y reportarlo como cambio de alcance.

## Orden obligatorio de ejecución

```text
Sprint 0  - Base técnica, solución y arquitectura
Módulo 1  - Seguridad, usuarios y permisos
Módulo 2  - Catálogos base para mostrador
Módulo 3  - Inventario central, existencias y kardex
Módulo 4  - Compras y recepción de mercancía
Módulo 5  - Ventas por mostrador
Módulo 6  - Cobranza y cuentas por cobrar
Módulo 7  - Auditoría, ajustes y cancelaciones
Módulo 8  - Reportes y dashboard backend de mostrador
Módulo 9  - Administración y configuración
```

## Skills obligatorias para todos los agentes

Cada agente debe leer y aplicar estas skills antes de modificar código:

```text
skills/skill_01_clean_architecture.md
skills/skill_02_vertical_slice.md
skills/skill_03_domain_events.md
skills/skill_04_efcore_postgresql_codefirst.md
skills/skill_05_api_validation_security.md
skills/skill_06_testing_acceptance.md
skills/skill_07_inventory_consistency.md
skills/skill_08_counter_sales_consistency.md
skills/SKILL_CONTROLLERS_ASPNET_CORE.md
```

## Reglas globales no negociables

1. El inventario nunca se modifica directamente como asignación simple de cantidad.
2. Todo cambio de stock nace de `InventoryMovement`.
3. `StockBalance` se actualiza transaccionalmente como consecuencia de movimientos.
4. Documentos confirmados o cerrados no se editan; se cancelan o ajustan con trazabilidad.
5. Operaciones que afecten inventario o dinero deben ejecutarse dentro de transacción.
6. Todo endpoint de escritura requiere usuario autenticado y permiso específico.
7. Todo cambio crítico genera `AuditLog`.
8. Precios y costos históricos se copian al detalle de venta o movimiento.
9. El controlador o endpoint no contiene reglas de negocio; solo invoca casos de uso.
10. El MVP maneja inventario de almacén central y mostrador, no inventario en unidades de reparto.

## Estructura de solución objetivo

```text
src/
  Distribuidora.Api/
    Endpoints/
    Middleware/
    Auth/
    Swagger/

  Distribuidora.Application/
    Abstractions/
    Common/
    Features/
      Security/
      Catalogs/
      Inventory/
      Purchases/
      CounterSales/
      AccountsReceivable/
      Audits/
      Reports/
      Administration/

  Distribuidora.Domain/
    Common/
    Security/
    Catalogs/
    Inventory/
    Purchases/
    Sales/
    AccountsReceivable/
    Audits/
    Administration/

  Distribuidora.Infrastructure/
    Persistence/
      AppDbContext.cs
      Configurations/
      Migrations/
      Seed/
    Services/
    Outbox/
    Files/

  Distribuidora.Contracts/
    Common/
    Requests/
    Responses/

tests/
  Distribuidora.UnitTests/
  Distribuidora.IntegrationTests/
```

## Contrato de salida para cada agente

Cada agente debe entregar siempre:

```md
## Resumen
Qué implementó y por qué.

## Archivos creados/modificados
Lista por proyecto.

## Decisiones técnicas
Explicar decisiones relevantes.

## Migraciones EF Core
Nombre de migración, tablas nuevas, índices y restricciones.

## Endpoints
Método, ruta, permisos y ejemplo request/response.

## Domain Events
Eventos publicados y consumidores.

## Pruebas
Unitarias e integración agregadas.

## Riesgos / pendientes
Puntos que requieren decisión humana.
```

## Gate de revisión antes de pasar de módulo

No avanzar de módulo hasta verificar:

- Toda la solución compila.
- `dotnet test` pasa.
- Las migraciones aplican en PostgreSQL.
- Swagger expone los endpoints nuevos.
- No hay reglas de negocio dentro de endpoints.
- No hay modificaciones directas de stock fuera del servicio transaccional de inventario.
- Los permisos y auditorías fueron considerados.
- No se introdujeron conceptos fuera del alcance actual.

## Prompt maestro para iniciar un agente

```text
Eres un agente senior de backend .NET. Implementa el módulo indicado siguiendo Clean Architecture, monolito modular, Vertical Slice, Domain Events y EF Core Code First con PostgreSQL. Antes de codificar, lee las skills indicadas y respeta las reglas globales del orquestador. No implementes frontend. No uses microservicios. No implementes reparto, almacenes móviles, cargas operativas, liquidaciones de reparto ni tracking. El alcance actual es venta por mostrador. Entrega código, migraciones, pruebas y documentación Swagger.
```
