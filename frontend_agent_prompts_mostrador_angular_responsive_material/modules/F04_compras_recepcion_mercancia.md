---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# F04 - Compras y recepción de mercancía

## Prompt del agente

```text
Implementa con Angular Material 3 y diseño mobile-first 100% responsive el flujo de compras y recepción: borrador, confirmación, recepción parcial/completa según contrato y cierre con impacto de inventario gestionado por backend.
```

## Objetivo

Permitir documentar compras y recibir mercancía sin confundir una orden con una entrada de inventario.

## Slices mínimos

- Listar compras por proveedor, fecha y estado.
- Crear/editar compra en borrador.
- Confirmar compra.
- Crear recepción desde compra o independiente si API lo permite.
- Capturar cantidades recibidas.
- Cerrar recepción.
- Consultar diferencias pedido/recibido.

## Reglas UX

- Mostrar claramente que confirmar compra no necesariamente aumenta inventario.
- Solo documentos en borrador son editables.
- Antes de cerrar recepción, mostrar resumen de cantidades y almacén destino.
- Productos y costos deben conservar precisión del contrato.
- Recepción cerrada se muestra read-only.

## Permisos esperados

```text
purchases.view/create/edit/confirm/cancel
receipts.view/create/close/cancel
```

## Pruebas críticas

- compra sin detalles no confirma.
- recepción no cierra sin cantidades válidas.
- estado cerrado bloquea edición.
- error de proveedor inactivo se muestra correctamente.
- cierre refresca existencia o muestra enlace al kardex.

## Contrato Material y responsive

- Captura de compra/recepción usa formulario responsive y detalle de productos adaptable.
- En móvil, líneas de productos se muestran como cards editables o filas expandibles; no depender de una tabla ancha.
- Totales y acción de guardar/cerrar permanecen accesibles mediante barra de acciones Material sticky cuando sea necesario.
- Confirmaciones breves usan `MatDialog`; captura larga usa página o fullscreen en móvil.
- Estados Borrador/Confirmado/Cerrado se presentan con chip, icono y texto.

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

Integrar las 10 operaciones `PUR-01..PUR-06` y `GRC-01..GRC-04` de `../06_MATRIZ_ENDPOINTS_FRONTEND.md`.

Dependencias de selectores: `SUP-01`, `PRD-01` y `WHS-01` mediante contratos públicos. Cada mutación de confirmar, cerrar o cancelar conserva la respuesta real y evita reintento automático.

## Composición mínima

- `purchase-list`, `purchase-editor`, `purchase-lines`, `purchase-detail`;
- `goods-receipt-editor`, `goods-receipt-detail`, `receipt-lines`;
- `DocumentStatusTimeline`, `CancellationFlow` y `OperationResult`;
- primitivas `ui-responsive-data-view`, `ui-filter-panel`, `ui-status-chip`, `ui-money`, `ui-date-time`, `ui-action-bar` y botones configurables.

Compra y recepción comparten composición de documento, pero no un mega componente con condicionales para todos los tipos documentales.
