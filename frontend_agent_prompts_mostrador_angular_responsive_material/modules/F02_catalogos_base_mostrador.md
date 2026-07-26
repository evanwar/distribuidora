---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# F02 - Catálogos base de mostrador

## Prompt del agente

```text
Implementa con Angular Material 3 y diseño mobile-first 100% responsive catálogos administrativos para productos, categorías, marcas, unidades, clientes y proveedores. Prioriza búsqueda, filtros, paginación y formularios reutilizables sin afectar inventario directamente.
```

## Objetivo

Mantener información maestra que alimenta compras, inventario, ventas y cobranza.

## Slices mínimos

### Productos

- Listar/buscar por SKU, código de barras, nombre, categoría y estado.
- Alta y edición.
- Detalle.
- Activar/desactivar con advertencias recibidas del backend.

### Clientes

- Listado, alta, edición y detalle.
- Estado de crédito visible, sin recalcularlo localmente.
- Acceso al estado de cuenta cuando exista permiso.

### Proveedores

- Listado, alta, edición y detalle.

### Catálogos auxiliares

- Categorías, marcas y unidades.

## Reglas UX

- La búsqueda por código de barras debe ejecutarse al presionar Enter o detectar lectura completa.
- No usar un autocomplete que descargue miles de productos.
- Los errores de duplicidad de SKU/código de barras deben mapearse al campo.
- Desactivar no significa eliminar.

## Permisos esperados

```text
products.view/create/edit/deactivate
customers.view/create/edit/deactivate
suppliers.view/create/edit/deactivate
catalogs.manage
```

## Pruebas críticas

- filtros persisten en query params.
- paginación solicita página al backend.
- duplicidad se muestra en control correcto.
- formulario de cliente exige datos requeridos por contrato.
- usuario sin permiso no ve acciones de edición.

## Contrato Material y responsive

- Filtros Material se muestran en una columna en móvil y grid fluido en tamaños mayores.
- Listados de productos/clientes/proveedores: `mat-table` en escritorio y cards/filas expandibles en móvil; SKU, nombre, estado y acción primaria siempre visibles.
- Formularios de alta/edición: una columna móvil, dos columnas progresivas en tableta/escritorio.
- Acciones secundarias de fila pasan a `mat-menu` en móvil.
- Autocomplete y paneles deben permanecer dentro del viewport y no descargar catálogos completos.

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

## Endpoints obligatorios y ownership

Integrar las 25 operaciones `CUS-01..CUS-03`, `SUP-01..SUP-03`, `PRD-01..PRD-04`, `PAL-01..PAL-03`, `CAT-01..CAT-03`, `BRD-01..BRD-03`, `UNT-01..UNT-03` y `WHS-01..WHS-03` de `../06_MATRIZ_ENDPOINTS_FRONTEND.md`.

La agrupación “Maestros” existe solo en navegación. El código debe separar:

```text
features/customers
features/suppliers
features/products
features/categories
features/brands
features/units
features/warehouses
```

Aliases pertenece a productos. Cada topic tiene rutas, adapter, store, modelos, UI y tests propios; un desarrollador no debe buscar clientes o proveedores dentro de un controlador/componente genérico de catálogos.

## Composición mínima

- reutilizar `EntityListShell`, `EntityEditorShell` y `EntitySelector` cuando se hayan consolidado;
- componentes de dominio: `customer-list/editor/selector`, `supplier-list/editor/selector`, `product-list/detail/editor/selector`, `product-alias-list/editor`;
- maestros simples configuran un patrón común, pero conservan adapters, ViewModels y permisos tipados;
- usar `ui-responsive-data-view`, `ui-filter-panel`, `ui-page-header`, `ui-action-bar`, `ui-button` y estados compartidos.

No crear un formulario dinámico universal basado en DTOs. Compartir layout y comportamiento; mantener explícitos los formularios tipados de cada dominio.
