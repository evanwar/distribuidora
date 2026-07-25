---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# 01 - Contexto de negocio y alcance del MVP Mostrador

## Negocio

Distribuidora de material para vulcanizadoras: parches, cámaras, válvulas, gatos, herramientas, consumibles y productos relacionados.

## Cambio de enfoque

El alcance anterior consideraba distribución con operación fuera del establecimiento. El alcance actual se reduce a venta directa en mostrador, con administración centralizada de inventario, compras, ventas, pagos, crédito y reportes.

## Problema a resolver ahora

El negocio necesita controlar:

- Qué productos existen.
- Cuánto inventario hay.
- Qué se compra y recibe.
- Qué se vende en mostrador.
- Cuánto se cobra.
- Qué queda pendiente por cobrar.
- Qué movimientos explican cada existencia.
- Qué usuario realizó cada operación.

## Flujo operativo mínimo

```text
1. Se crean productos, clientes, proveedores y almacenes.
2. Se registra una compra o recepción.
3. La recepción aumenta inventario mediante movimientos.
4. El usuario crea una venta por mostrador.
5. La venta se confirma.
6. Se descuenta inventario del almacén central o punto de venta.
7. Se registra pago de contado o cuenta por cobrar.
8. Se genera auditoría, kardex y reportes.
```

## Alcance incluido

- API REST backend.
- Autenticación JWT.
- Roles y permisos.
- Catálogos.
- Inventario central.
- Kardex.
- Compras y recepción.
- Ventas por mostrador.
- Pagos básicos.
- Cuentas por cobrar si hay crédito.
- Cancelaciones controladas.
- Ajustes de inventario.
- Auditoría.
- Reportes backend mínimos.
- Swagger/OpenAPI.
- Pruebas unitarias e integración.

## Alcance excluido

- Frontend web.
- App móvil.
- Facturación electrónica.
- Contabilidad completa.
- Multiempresa avanzada.
- Optimización logística.
- Procesos de reparto.
- Seguimiento de unidades.
- Liquidaciones de personal externo al mostrador.

## Criterios de éxito

| Criterio | Cómo se comprueba |
|---|---|
| Trazabilidad | Todo cambio de inventario genera movimiento con usuario, fecha y referencia. |
| Venta confiable | Una venta confirmada descuenta inventario y conserva precios históricos. |
| Cobro claro | Toda venta queda como pagada, parcialmente pagada o pendiente. |
| Consulta rápida | Se puede consultar stock actual y kardex por producto. |
| Operación sin frontend | Los endpoints pueden probarse desde Swagger/Postman. |
| Seguridad | Todo endpoint crítico exige autenticación y permiso. |
