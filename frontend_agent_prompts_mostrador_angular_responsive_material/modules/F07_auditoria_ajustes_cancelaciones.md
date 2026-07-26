---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# F07 - Auditoría, ajustes y cancelaciones

## Prompt del agente

```text
Implementa con Angular Material 3 y diseño mobile-first 100% responsive consultas de auditoría y flujos controlados de ajuste/cancelación. La UI debe hacer visible quién, cuándo, qué cambió y por qué, sin permitir editar documentos cerrados.
```

## Objetivo

Ofrecer trazabilidad y acceso seguro a operaciones excepcionales.

## Slices mínimos

- Bitácora por usuario, entidad, acción y fecha.
- Detalle before/after legible.
- Consulta de cancelaciones.
- Diálogo de cancelación con motivo.
- Consulta de ajustes de inventario.
- Acceso por deep link desde venta/movimiento.

## Reglas UX

- Datos sensibles en before/after deben ocultarse según contrato.
- JSON técnico puede estar disponible en panel avanzado, pero presentar primero resumen humano.
- Documento cerrado no muestra editar.
- Cancelación debe listar consecuencias que el backend reporte.
- Siempre mostrar actor, fecha y motivo.

## Permisos esperados

```text
audit.view
audit.details.view
sales.cancel
inventory.adjust
purchases.cancel
receipts.cancel
```

## Pruebas críticas

- filtros se envían al backend.
- usuario sin permiso no abre detalle.
- cancelar exige motivo.
- después de cancelar, estado cambia a respuesta del servidor.
- conflicto evita mostrar cancelación exitosa falsa.

## Contrato Material y responsive

- Bitácora: filtros colapsables en móvil; tabla en escritorio y cards/expansión en móvil.
- Before/after humano se presenta en paneles Material apilados en móvil y columnas solo cuando exista espacio.
- JSON técnico usa contenedor con overflow interno, nunca overflow del body.
- Cancelación breve con `MatDialog`; consecuencias extensas en fullscreen/página móvil.
- Actor, fecha, motivo y estado nunca se ocultan por responsive.

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

Integrar las 15 operaciones `AUD-01..AUD-03`, `CRS-01..CRS-03`, `OPN-01` y `LOG-01..LOG-08` de `../06_MATRIZ_ENDPOINTS_FRONTEND.md`.

Las cancelaciones `SAL-07`, `PUR-06`, `GRC-04` e `INV-06` conservan adapters en sus features propietarias y reutilizan `CancellationFlow`. Esta feature aporta motivos, auditoría, notas, logs y deep links; no duplica mutaciones documentales.

## Composición mínima

- `audit-list`, `audit-detail`, `entity-audit-history`, `before-after-view`;
- `cancellation-reason-list/editor`, `operational-note-editor`;
- `activity-log-list/detail`, `error-log-list/detail`, `system-event-list/detail`;
- `CancellationFlow`, `ui-responsive-data-view`, `ui-filter-panel`, `ui-status-chip`, `ui-alert`, `ui-date-time` y botones configurables.

El JSON técnico es un componente de detalle avanzado con overflow interno, copy seguro y redacción conforme al contrato.
