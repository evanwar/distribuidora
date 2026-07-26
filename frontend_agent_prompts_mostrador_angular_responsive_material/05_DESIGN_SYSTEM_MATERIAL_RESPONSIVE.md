---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
ui_contract: Mobile-first, 100% responsive, Angular Material como único sistema visual
---

# 05 - Sistema de diseño Material y contrato responsive

## Contrato de composición

Este documento define apariencia y comportamiento responsive; `07_ARQUITECTURA_COMPONENTES_UX.md` define las APIs de componentes que lo aplican. Las features deben configurar primitivas compartidas mediante propiedades tipadas y tokens semánticos. No deben copiar controles para cambiar texto, color, icono, loading o tamaño.

El wrapper de una primitiva es válido solo si aporta comportamiento transversal verificable. Para controles de formulario sin valor agregado, se compone Angular Material directamente y se reutilizan layout, mensajes y validadores.

## Objetivo obligatorio

Toda pantalla, componente, formulario, tabla, diálogo y flujo debe construirse con enfoque **mobile-first**, ser completamente utilizable desde **320 px hasta pantallas de escritorio amplias** y utilizar **Angular Material + CDK** como sistema visual base.

“Responsive” no significa únicamente que la página no se rompa. Significa que todas las funciones siguen disponibles, legibles, operables y accesibles en teléfono, tableta, laptop y escritorio, sin depender de una resolución fija.

## Librería visual permitida

Usar exclusivamente:

```text
Angular Material
Angular CDK
CSS/SCSS nativo para layout y branding
Material Symbols/MatIcon mediante la estrategia aprobada
```

No agregar Bootstrap, Tailwind, PrimeNG, Ionic, Ant Design, Nebular u otra librería de componentes sin ADR aprobado. No mezclar dos sistemas de diseño.

El CSS personalizado puede resolver grid, flex, spacing, responsive y branding, pero no debe recrear botones, inputs, diálogos, menús, tablas o controles que Angular Material ya ofrece.

## Material Design 3

Configurar un tema Material 3 centralizado mediante las APIs soportadas por la versión fijada de Angular Material.

El tema debe controlar al menos:

- paleta primaria, secundaria/terciaria y estados de error;
- tipografía;
- densidad;
- forma/bordes;
- superficies, elevación y contraste;
- estados hover, focus, pressed, disabled y selected.

No colocar colores de negocio directamente en componentes. Exponer tokens semánticos o variables CSS desde el tema.

## Componentes Material preferidos

| Necesidad | Componente base |
|---|---|
| Navegación principal | `mat-sidenav`, `mat-drawer`, `mat-toolbar`, `mat-nav-list` |
| Formularios | `mat-form-field`, `matInput`, `mat-select`, `mat-autocomplete`, `mat-datepicker`, `mat-checkbox`, `mat-radio` |
| Acciones | `mat-button`, `mat-raised-button`, `mat-flat-button`, `mat-icon-button`, `mat-fab` cuando sea apropiado |
| Datos tabulares | `mat-table`, `mat-sort`, `mat-paginator` o una vista compacta Material equivalente |
| Confirmaciones | `MatDialog` |
| Acciones móviles contextuales | `MatBottomSheet` cuando mejore la experiencia |
| Retroalimentación | `MatSnackBar`, banners/alertas accesibles y progress indicators |
| Estados y etiquetas | `mat-chip`, icono + texto, nunca solo color |
| Expansión/detalle | `mat-expansion-panel`, `mat-card`, drawer o página de detalle |
| Carga | `mat-progress-spinner`, `mat-progress-bar`, skeleton propio accesible |

No usar un elemento HTML sin estilo cuando exista un equivalente Material adecuado, salvo que la semántica o accesibilidad justifique lo contrario.

## Breakpoints centralizados

Definir una única fuente de verdad para breakpoints. Como guía inicial:

```text
xs / móvil compacto:      0 - 599 px
sm / móvil amplio-tablet: 600 - 959 px
md / tablet-laptop:       960 - 1279 px
lg / escritorio:          1280 - 1919 px
xl / escritorio amplio:   1920 px o más
```

Usar CSS media/container queries para layout visual. Usar `BreakpointObserver` únicamente cuando el comportamiento del componente realmente cambie y no pueda resolverse solo con CSS.

No dispersar valores de breakpoints en múltiples archivos.

## Reglas responsive no negociables

1. Diseñar primero para el ancho menor soportado y enriquecer progresivamente.
2. No usar anchos fijos de página ni depender de una resolución exacta.
3. No permitir scroll horizontal del `body` o del shell.
4. Cualquier overflow horizontal inevitable debe quedar contenido y ser accesible dentro del componente específico.
5. Formularios: una columna en móvil; dos o más columnas solo cuando el espacio y la legibilidad lo permitan.
6. Acciones primarias deben seguir visibles o accesibles en todos los tamaños.
7. Controles táctiles deben tener un objetivo mínimo aproximado de 48 × 48 px.
8. No ocultar información o funciones críticas solo para “hacer que quepa”. Reubicar, agrupar o usar detalle progresivo.
9. Imágenes, gráficas y contenido embebido deben usar dimensiones fluidas y límites máximos.
10. Textos, importes, folios y SKU largos deben truncarse de forma segura con tooltip/detalle o ajustarse sin romper layout.
11. Validar orientación vertical y horizontal cuando sea relevante.
12. Validar zoom del navegador al 200% sin pérdida de funcionalidad.

## Shell responsive

### Móvil

- `mat-sidenav` en modo `over` y cerrado por defecto.
- Toolbar compacta con título contextual y acciones esenciales.
- Navegación secundaria mediante menú, tabs desplazables o navegación dentro de la feature.
- El contenido usa todo el ancho disponible con padding reducido por token.

### Tableta

- Sidenav puede ser `over` o `side` según ancho disponible y tarea.
- Formularios y paneles pueden usar dos columnas.
- Acciones frecuentes permanecen visibles.

### Escritorio

- Sidenav persistente o colapsable.
- Contenido con ancho máximo razonable solo cuando mejore lectura; las estaciones operativas pueden aprovechar todo el ancho.
- No aumentar espacios de manera desproporcionada.

## Tablas y listados responsive

No asumir que una tabla de escritorio cabe en móvil.

Seleccionar explícitamente una estrategia por listado:

1. **Columnas prioritarias:** ocultar solo columnas secundarias y ofrecer detalle completo.
2. **Fila expandible:** mostrar campos adicionales en expansión accesible.
3. **Cards/lista Material:** transformar cada registro en una tarjeta semántica en móvil.
4. **Scroll contenido:** únicamente para datos que requieren comparación horizontal; no usarlo como solución universal.

Mantener paginación, orden, filtros, selección y acciones disponibles. Las acciones de fila pueden pasar a `mat-menu` en tamaños pequeños.

## Formularios responsive

- Usar CSS Grid fluido con áreas o columnas adaptativas.
- `mat-form-field` ocupa `width: 100%` dentro de su celda.
- Agrupar campos relacionados con títulos/fieldset semántico.
- Errores deben permanecer junto al campo y no generar saltos que oculten la acción principal.
- Barras de acciones pueden ser sticky en móvil si no cubren contenido ni teclado virtual.
- Diálogos con formularios largos deben convertirse en página o diálogo fullscreen en móvil; evitar modales anidados.

## Diálogos, drawers y bottom sheets

- Diálogo de escritorio: ancho máximo y contenido scrolleable interno.
- Móvil: usar configuración fullscreen o una página dedicada para procesos largos.
- Confirmaciones breves pueden seguir siendo diálogo.
- Acciones contextuales compactas pueden usar bottom sheet.
- Siempre restaurar foco al elemento que abrió el overlay.

## Punto de venta responsive

### Escritorio

```text
buscador + carrito principal + panel lateral de totales/pago
```

### Tableta

```text
buscador superior + carrito + resumen colapsable o drawer lateral
```

### Móvil

```text
buscador sticky
lista de productos/carrito en una columna
resumen compacto sticky o bottom sheet
acción Cobrar siempre accesible
```

En móvil no eliminar funciones de venta. Descuentos, cliente, pagos y confirmación pueden moverse a pasos/drawers, pero deben conservarse. El flujo debe seguir siendo compatible con teclado físico o escáner cuando estén presentes y también con interacción táctil.

## Accesibilidad ligada al responsive

- Foco visible en todos los tamaños.
- Orden DOM coherente con orden visual.
- No cambiar visualmente el orden de controles de forma que rompa navegación por teclado.
- Labels y descripciones accesibles.
- Estados comunicados con texto/icono además de color.
- Contraste conforme a WCAG AA.
- Overlays con focus trap y nombre accesible.
- Gráficas con resumen o tabla alternativa.

## Validación obligatoria de viewport

Cada slice visual debe probarse, como mínimo, en:

```text
320 × 568
360 × 800
390 × 844
768 × 1024
1024 × 768
1366 × 768
1440 × 900
1920 × 1080
```

No es obligatorio tomar snapshots de todos en cada test, pero sí cubrir móvil, tableta y escritorio en Playwright para los flujos críticos.

## Pruebas responsive y visuales

Agregar verificaciones para:

- ausencia de overflow global;
- navegación y acciones disponibles;
- cambio correcto de sidenav;
- tablas/listados adaptados;
- formularios sin controles cortados;
- overlays dentro del viewport;
- teclado y foco;
- zoom/escala cuando sea automatizable;
- screenshots de referencia para pantallas críticas, con umbrales controlados.

## Definition of Done visual

Un slice no está terminado hasta cumplir:

```text
[ ] usa Angular Material/CDK como sistema visual
[ ] usa tokens del tema y no colores dispersos
[ ] funciona desde 320 px hasta escritorio amplio
[ ] no produce overflow horizontal global
[ ] conserva todas las acciones críticas en móvil
[ ] tablas/listados tienen estrategia responsive explícita
[ ] formularios y overlays se adaptan al viewport
[ ] cumple navegación por teclado y foco visible
[ ] tiene pruebas en móvil, tableta y escritorio
[ ] se adjunta evidencia de viewport o Playwright
```
