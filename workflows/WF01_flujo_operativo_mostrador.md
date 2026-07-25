---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# WF01 - Flujo operativo mínimo de mostrador

## Flujo

```text
Catálogos -> Compra/Recepción -> Inventario -> Venta mostrador -> Pago/CxC -> Reporte/Auditoría
```

## Paso 1: Catálogos

Crear:

- Producto.
- Cliente opcional.
- Proveedor.
- Almacén central.
- Métodos de pago.

## Paso 2: Recepción

1. Crear compra opcional.
2. Crear recepción.
3. Capturar productos recibidos.
4. Cerrar recepción.
5. Generar movimientos de entrada.
6. Actualizar stock.

## Paso 3: Venta

1. Crear venta en borrador.
2. Agregar productos.
3. Calcular totales.
4. Validar stock.
5. Confirmar venta.
6. Descontar inventario.
7. Registrar pago o cuenta por cobrar.

## Paso 4: Cancelación

1. Solicitar cancelación con motivo.
2. Validar permiso.
3. Generar movimiento inverso.
4. Ajustar pago o saldo.
5. Auditar.

## Paso 5: Reportes

Consultar:

- Ventas del día.
- Stock actual.
- Productos bajos.
- Cuentas por cobrar.
- Utilidad bruta estimada.
