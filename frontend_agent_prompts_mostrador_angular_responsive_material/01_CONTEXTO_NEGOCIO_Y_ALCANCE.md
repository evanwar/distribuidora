---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# 01 - Contexto de negocio y alcance

## Problema

La distribuidora necesita controlar productos, existencias, compras y ventas en un punto de mostrador. El frontend debe permitir operar el sistema con rapidez sin ocultar la trazabilidad ni sustituir las reglas del backend.

## Usuario principal

- Cajero o vendedor de mostrador.
- Encargado de almacén.
- Administrador.
- Responsable de compras.
- Responsable de cobranza.

## Flujo operativo principal

```text
1. Usuario inicia sesión.
2. Consulta o registra productos/clientes.
3. Recibe mercancía y consulta inventario.
4. Crea una venta de mostrador.
5. Busca productos por SKU, código de barras o nombre.
6. Captura cantidades, cliente y condición de pago.
7. Confirma la venta contra backend.
8. Registra pago o genera saldo por cobrar.
9. Imprime o presenta comprobante.
10. Consulta kardex, auditoría y reportes.
```

## Prioridad UX

La venta de mostrador debe poder completarse con el mínimo de clics. La navegación por teclado, el foco automático, la búsqueda rápida y la prevención de doble confirmación son requisitos funcionales.

## Alcance incluido

- Login, sesión y permisos.
- Productos, categorías, marcas y unidades.
- Clientes y proveedores.
- Inventario central, kardex, stock mínimo y ajustes autorizados.
- Compras y recepción.
- Ventas por mostrador de contado, crédito o mixtas según backend.
- Pagos y cuentas por cobrar.
- Cancelaciones y consulta de auditoría.
- Reportes administrativos básicos.
- Configuración de folios, impuestos y parámetros expuestos por backend.

## Fuera de alcance

- Reparto y distribución.
- Camionetas, choferes y almacenes móviles.
- Rutas, cargas y liquidaciones.
- GPS.
- Aplicación móvil nativa.
- Facturación electrónica, salvo que se agregue formalmente al backend.
- Modo offline completo.
- E-commerce público.

## Principios de producto

- La aplicación debe revelar claramente cuándo un documento está en borrador, confirmado, cerrado o cancelado.
- No prometer éxito antes de recibir respuesta del backend.
- Mostrar datos históricos de la venta, no reinterpretarlos con precios actuales.
- Las acciones destructivas o irreversibles requieren confirmación y motivo.
- Los mensajes deben usar lenguaje operativo y no jerga técnica.


## Alcance de dispositivos

El sistema es una única aplicación responsive. Debe conservar funcionalidad completa en:

```text
teléfono desde 320 px
tableta vertical y horizontal
laptop de resolución reducida
escritorio estándar y amplio
```

Aunque la venta por mostrador prioriza teclado, escáner y escritorio, ningún módulo administrativo puede quedar inutilizable en móvil o tableta. La UI debe usar Angular Material como sistema visual coherente.
