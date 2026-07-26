---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# F06 - Cobranza y cuentas por cobrar

## Prompt del agente

```text
Implementa con Angular Material 3 y diseño mobile-first 100% responsive consulta de saldos, estado de cuenta y registro/aplicación de pagos de clientes. No recalcules saldo autoritativo; usa siempre la respuesta del backend.
```

## Objetivo

Dar visibilidad a ventas a crédito y permitir cobrar con trazabilidad.

## Slices mínimos

- Listado de cuentas por cobrar.
- Filtros por cliente, vencimiento y estado.
- Estado de cuenta del cliente.
- Registrar pago.
- Aplicar pago mediante la operación autoritativa expuesta por API.
- Comprobante de pago.
- Historial de límite de crédito si está expuesto.

## Reglas UX

- Diferenciar vencido, vigente y pagado con texto además de color.
- No permitir aplicar más del monto disponible salvo respuesta explícita del backend.
- Mostrar saldo antes y después devuelto por API.
- Pago enviado no se reintenta automáticamente.
- La pantalla debe indicar qué venta originó cada saldo.

## Permisos esperados

```text
receivables.view
receivables.statement.view
payments.register
payments.apply
customers.credit_limit.change
```

## Pruebas críticas

- pago parcial actualiza saldo real.
- aplicación inválida muestra errores por cuenta.
- doble click no duplica pago.
- usuario sin permiso ve estado pero no botón de cobro.
- error 409 obliga a recargar saldos.

## Contrato Material y responsive

- Estado de cuenta: tabla en escritorio y lista/card por documento en móvil.
- Cliente, vencimiento, saldo, estado y acción de pago permanecen visibles.
- Aplicación de pagos a múltiples cuentas usa selección Material accesible y resumen sticky en móvil.
- Formulario de pago puede usar diálogo en escritorio y fullscreen/bottom sheet en móvil según complejidad.
- Estados vencido/vigente/pagado usan texto + icono/chip, no solo color.

## Reglas de implementación

- Crear rutas lazy.
- Consumir API mediante adapter y cliente generado.
- Usar Signals para estado de feature.
- Usar Reactive Forms tipados cuando exista captura.
- Implementar loading, vacío, error, éxito y forbidden.
- Aplicar permisos en rutas y acciones.
- No duplicar reglas autoritativas del backend.
- Agregar pruebas unitarias/componentes y E2E crítico.

## Contrato de entrega

```text
[ ] route/slice implementado
[ ] componentes Angular Material accesibles
[ ] comportamiento responsive móvil/tableta/escritorio validado
[ ] sin overflow horizontal global
[ ] store/facade implementado
[ ] adapter OpenAPI implementado
[ ] validaciones implementadas
[ ] permisos aplicados
[ ] errores y correlationId manejados
[ ] tests agregados
[ ] ng test pasa
[ ] ng build pasa
```

## Endpoints obligatorios y cobertura

Integrar las 7 operaciones `ACR-01..ACR-03` y `CPY-01..CPY-04` de `../06_MATRIZ_ENDPOINTS_FRONTEND.md`.

La UI registra primero el pago y aplica su distribución con las operaciones explícitas del backend. No simular aplicación múltiple ni cálculo de saldo cuando el DTO no lo permita.

## Composición mínima

- `receivable-list`, `receivable-detail`, `customer-statement`;
- `customer-payment-editor`, `payment-application`, `payment-result`;
- `credit-limit-editor` con permiso y confirmación;
- `ui-responsive-data-view`, `ui-filter-panel`, `ui-status-chip`, `ui-money`, `ui-date-time`, `ui-action-bar` y botones configurables.

Los estados vencido/vigente/pagado usan un solo `ui-status-chip` configurado semánticamente, no implementaciones distintas.
