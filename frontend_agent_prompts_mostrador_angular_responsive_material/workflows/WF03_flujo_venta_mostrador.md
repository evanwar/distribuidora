---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# WF03 - Flujo E2E de venta por mostrador

## Preparación

- Usuario autenticado con permiso de venta.
- Almacén de mostrador configurado.
- Productos activos con stock.
- Métodos de pago disponibles.

## Escenario contado

1. Abrir nueva venta.
2. Buscar/escaneo de producto.
3. Agregar y ajustar cantidad.
4. Revisar total preliminar.
5. Abrir cobro.
6. Capturar pago completo.
7. Confirmar una sola vez.
8. Esperar respuesta.
9. Mostrar folio, total y estado real.
10. Ofrecer imprimir/nueva venta.
11. Verificar stock actualizado en consulta posterior.

## Escenario crédito

1. Seleccionar cliente activo.
2. Agregar productos.
3. Elegir crédito.
4. Backend valida límite/saldo.
5. Confirmar.
6. Mostrar saldo generado y vencimiento devuelto.

## Errores obligatorios

- producto sin stock al confirmar;
- precio cambiado;
- crédito bloqueado;
- 409 por concurrencia;
- timeout sin certeza de resultado;
- doble click;
- sesión expirada;
- permiso revocado.

En timeout de una mutación, consultar el estado antes de permitir repetir cuando el backend ofrezca clave idempotente o búsqueda por identificador.


## Adaptación responsive obligatoria

- Escritorio: carrito y resumen pueden coexistir en columnas.
- Tableta: resumen colapsable/drawer sin perder contexto del carrito.
- Móvil: flujo de una columna, buscador y acción Cobrar accesibles, resumen mediante panel sticky o bottom sheet.
- Ninguna función de cliente, descuento, pagos o confirmación se elimina en móvil.
- Probar interacción táctil y también teclado/escáner cuando estén disponibles.
