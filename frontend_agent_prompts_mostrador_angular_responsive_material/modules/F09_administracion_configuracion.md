---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# F09 - Administración y configuración

## Prompt del agente

```text
Implementa con Angular Material 3 y diseño mobile-first 100% responsive pantallas de configuración expuestas por backend: empresa, folios, impuestos, moneda, almacén predeterminado y parámetros de mostrador. No inventes configuraciones locales que cambien reglas de negocio.
```

## Objetivo

Permitir configurar parámetros operativos con controles, auditoría y protección administrativa.

## Slices mínimos

- Datos generales del negocio.
- Series/folios.
- Impuestos y moneda.
- Almacén de mostrador predeterminado.
- Parámetros de ventas: descuentos, precios, crédito según API.
- Configuración visual local no sensible: densidad o preferencia de tema, si se aprueba.

## Reglas UX

- Separar configuración de negocio de preferencias personales.
- Cambios críticos requieren confirmación.
- Mostrar versión/fecha de configuración cuando backend la exponga.
- Manejar concurrencia con 409.
- No guardar secretos en frontend.

## Permisos esperados

```text
settings.view
settings.edit
settings.folios.manage
settings.taxes.manage
```

## Pruebas críticas

- usuario sin permiso no puede guardar.
- configuración inválida muestra errores por campo.
- conflicto ofrece recargar.
- cambios exitosos actualizan config global.
- secretos nunca aparecen en logs o storage.

## Contrato Material y responsive

- Configuración agrupada con `mat-card`, tabs/stepper solo si siguen siendo accesibles y utilizables en móvil.
- Formularios: una columna móvil, dos columnas progresivas para campos cortos.
- Guardar/cancelar permanecen visibles mediante barra de acciones adaptativa.
- Navegación interna usa sidenav/tabs responsive sin ocultar secciones.
- Diálogos de confirmación deben caber en 320 px y restaurar foco.

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

Integrar las 23 operaciones `SET-01..SET-02`, `FOL-01..FOL-03`, `PMT-01..PMT-03`, `PTR-01..PTR-07`, `PLC-01..PLC-04` y `TRC-01..TRC-04` de `../06_MATRIZ_ENDPOINTS_FRONTEND.md`.

Solo mostrar settings y políticas presentes en DTO/OpenAPI. Impuestos, moneda o almacén predeterminado no se inventan como almacenamiento local si el contrato no los entrega.

## Composición mínima

- `settings-list/editor`, `folio-sequence-list/editor`;
- `payment-method-list/editor`;
- `payment-terminal-list/editor` con alta, edición, baja lógica, reactivación y terminal predeterminada;
- `credit-policy-editor`, `inventory-policy-editor`;
- `trace-search`, `trace-timeline`, `trace-detail`;
- `EntityListShell`, `EntityEditorShell`, `ui-status-chip`, `ui-alert`, `ui-action-bar`, `ui-date-time` y botones configurables.

Administración se agrupa en navegación, pero settings, folios, métodos de pago, políticas y trazas conservan ownership técnico separado.
