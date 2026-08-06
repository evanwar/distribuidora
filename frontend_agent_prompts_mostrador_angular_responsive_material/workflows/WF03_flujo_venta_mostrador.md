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
6. Seleccionar el método de pago.
7. Si es efectivo, capturar obligatoriamente el efectivo recibido.
8. Si el efectivo recibido es menor al total a cobrar, mostrar validación y mantener bloqueada la confirmación.
9. Si supera el total, mostrar antes de confirmar el **Cambio a devolver**, calculado como `efectivo recibido - total a cobrar`; nunca mostrar cambio negativo.
10. Confirmar una sola vez. Registrar como pago el importe adeudado, no el excedente que se devuelve como cambio.
11. Esperar respuesta.
12. Mostrar folio, total y estado real, conservando visible el cambio a devolver durante el cierre del cobro.
13. Ofrecer imprimir/nueva venta.
14. Verificar stock actualizado en consulta posterior.

En pago mixto, la suficiencia y el cambio del efectivo se calculan contra la porción de la deuda asignada a efectivo, después de considerar los otros medios de pago.

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
- efectivo menor al importe que debe cubrir;
- cambio de método efectivo a no efectivo con un monto previamente capturado;
- sesión expirada;
- permiso revocado.

En timeout de una mutación, consultar el estado antes de permitir repetir cuando el backend ofrezca clave idempotente o búsqueda por identificador.


## Adaptación responsive obligatoria

- Escritorio: carrito y resumen pueden coexistir en columnas.
- Tableta: resumen colapsable/drawer sin perder contexto del carrito.
- Móvil: flujo de una columna, buscador y acción Cobrar accesibles, resumen mediante panel sticky o bottom sheet.
- Ninguna función de cliente, descuento, pagos o confirmación se elimina en móvil.
- Probar interacción táctil y también teclado/escáner cuando estén disponibles.
