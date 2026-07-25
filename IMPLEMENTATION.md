# Implementación del MVP de mostrador

## Resumen

Se implementó una API backend modular para el ciclo:

```text
catálogos -> compra/recepción -> inventario -> venta de mostrador
-> pago/cuenta por cobrar -> auditoría/reportes
```

La solución separa Domain, Application, Infrastructure, Contracts y API. Las reglas de documentos, inventario, pagos y crédito viven fuera de los endpoints. Cada afectación de stock crea un `InventoryMovement` y actualiza `StockBalance` dentro de una transacción.

## Archivos creados/modificados

- `src/Distribuidora.Domain`: entidades, agregados, enums, reglas y domain events para M01–M09.
- `src/Distribuidora.Application`: abstracciones, validadores y servicios de casos de uso.
- `src/Distribuidora.Infrastructure`: EF Core, configuraciones PostgreSQL, JWT, hashing PBKDF2, outbox y seeds.
- `src/Distribuidora.Api`: MVC Controllers V1, permisos, Swagger, middleware de errores y respuesta estándar.
- `src/Distribuidora.Contracts`: requests, paginación y contrato de respuesta.
- `tests/Distribuidora.UnitTests`: pruebas de invariantes puras.
- `tests/Distribuidora.IntegrationTests`: salud, Swagger y autorización.
- `artifacts/InitialCounterSalesMvp.sql`: SQL idempotente generado por EF.

## Decisiones técnicas

- GUID para identidades.
- Esquemas PostgreSQL: `security`, `catalogs`, `inventory`, `purchases`, `sales`, `receivables`, `audit`, `admin`.
- Dinero como `numeric(18,2)` y cantidades como `numeric(18,4)`.
- JWT de 30 minutos y refresh tokens rotables almacenados únicamente como SHA-256.
- Passwords con PBKDF2-SHA256, salt aleatorio y 120,000 iteraciones.
- Permisos con nomenclatura `module.action` y policies de ASP.NET Core.
- Domain events persistidos en `audit.outbox_messages` en el mismo `SaveChanges`.
- Folios incrementales bajo el contexto transaccional de cada operación.
- Migración automática deshabilitada por defecto.

## Migraciones EF Core

Migración: `InitialCounterSalesMvp`.

Incluye 40 tablas, claves foráneas, índices únicos y de consulta, ocho esquemas, tokens de concurrencia y tablas de outbox/auditoría. El SQL idempotente está en `artifacts/InitialCounterSalesMvp.sql`.

## Endpoints

Los endpoints se agrupan en:

- `/api/v1/auth`, `/api/v1/users`, `/api/v1/roles`, `/api/v1/permissions`
- `/api/v1/products`, `/api/v1/categories`, `/api/v1/brands`, `/api/v1/units`, `/api/v1/customers`, `/api/v1/suppliers`, `/api/v1/warehouses`
- `/api/v1/inventory`
- `/api/v1/purchases`, `/api/v1/goods-receipts`
- `/api/v1/counter-sales`
- `/api/v1/accounts-receivable`, `/api/v1/customer-payments`
- `/api/v1/audit`, `/api/v1/cancellation-reasons`, `/api/v1/operational-notes`
- `/api/v1/reports`, `/api/v1/dashboard`
- `/api/v1/admin`

Swagger documenta rutas, verbos, schemas y autenticación Bearer. Cada escritura exige JWT y el permiso granular correspondiente.

## Domain Events

Los agregados publican hechos de negocio a través de `EntityChangedDomainEvent`, con nombres funcionales como:

- `StockBalanceChanged`
- `InventoryAdjustmentConfirmed`
- `PurchaseOrderConfirmed`
- `GoodsReceiptClosed`
- `CounterSaleConfirmed`
- `SalePaymentRegistered`
- `CounterSaleCancelled`
- `PaymentAllocated`
- `UserDeactivated`

El `AppDbContext` los serializa al outbox antes de confirmar la unidad de trabajo.

## Pruebas

- 10 pruebas unitarias: stock, pagos, venta de contado, estados inmutables, cancelaciones, cuentas por cobrar, recepciones y folios.
- 3 pruebas de integración: health check, documento Swagger con endpoints críticos y rechazo de escritura anónima.
- `dotnet build Distribuidora.slnx --no-restore`: exitoso, sin warnings ni errores.
- `dotnet test Distribuidora.slnx --no-restore`: 13/13 exitosas.
- Generación de migración y SQL idempotente: exitosa.

## Riesgos / pendientes

- No había un servidor PostgreSQL ni Docker instalado en el ambiente de ejecución; la migración se validó generando el SQL idempotente, pero debe aplicarse contra la instancia objetivo como parte del despliegue.
- La clave JWT, conexión y contraseña inicial incluidas son valores de desarrollo y deben reemplazarse por secretos administrados.
- Para producción se recomienda agregar pruebas de integración con Testcontainers/PostgreSQL y procesamiento en segundo plano del outbox.
- El baseline inicial agrupa los nueve módulos en una sola migración coherente; futuras modificaciones deben generar migraciones pequeñas por módulo.
