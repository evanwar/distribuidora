---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# F03 - Inventario central, existencias y kardex

## Prompt del agente

```text
Implementa con Angular Material 3 y diseño mobile-first 100% responsive consultas y operaciones autorizadas de inventario central. Representa movimientos y balances como datos auditables; nunca agregues botones que alteren cantidad directamente.
```

## Objetivo

Consultar existencia por producto/almacén, revisar kardex, stock mínimo y capturar ajustes controlados.

## Slices mínimos

- Existencias actuales.
- Kardex por producto y rango de fecha.
- Productos bajo mínimo.
- Crear ajuste con motivo y permiso.
- Consultar detalle de movimiento.
- Transferencia entre ubicaciones únicamente si sigue activa en backend.

## Reglas UX

- Separar cantidad disponible, reservada y total cuando el backend las exponga.
- No colorear cantidades negativas como único indicador; incluir texto/ícono.
- Mostrar referencia, tipo, fecha, usuario y correlación del movimiento.
- Ajuste requiere confirmación, motivo y resumen antes de enviar.
- Después de ajustar, recargar el balance real del backend.

## Permisos esperados

```text
inventory.view
inventory.kardex.view
inventory.adjust
inventory.transfer
```

## Pruebas críticas

- consulta aplica filtros server-side.
- ajuste no se envía sin motivo.
- doble envío está bloqueado.
- conflicto 409 ofrece recargar.
- saldo mostrado se actualiza con respuesta del servidor.

## Contrato Material y responsive

- Balances: tabla comparativa en escritorio; cards o expansión por producto en móvil.
- Kardex: filtros colapsables Material en móvil y visibles en escritorio.
- Mantener cantidad, almacén, fecha, tipo y referencia accesibles en cualquier viewport.
- El diálogo de ajuste se vuelve fullscreen/página en móvil si requiere varios campos o resumen.
- Importes/cantidades negativos usan icono + texto, no solo color.

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

Integrar las 7 operaciones `INV-01..INV-07` de `../06_MATRIZ_ENDPOINTS_FRONTEND.md`: balances, kardex, stock bajo, alta/confirmación/cancelación de ajustes y transferencias.

Dependencias de selectores: `PRD-01` y `WHS-01` mediante contratos públicos; no importar stores internos de productos o almacenes.

## Composición mínima

- `inventory-balance-list`, `kardex-list`, `low-stock-list`;
- `inventory-adjustment-editor`, `adjustment-summary`, `inventory-transfer-editor`;
- `DocumentStatusTimeline` para el estado del ajuste;
- `CancellationFlow` para `INV-06`;
- primitivas `ui-responsive-data-view`, `ui-filter-panel`, `ui-status-chip`, `ui-money`, `ui-date-time`, `ui-action-bar` y `ui-button`.

La confirmación y cancelación son componentes/acciones configuradas por estado y permiso; no se duplican botones ni diálogos por cada documento.
