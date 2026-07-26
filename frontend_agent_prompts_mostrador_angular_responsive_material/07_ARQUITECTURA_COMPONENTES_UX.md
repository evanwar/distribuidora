---
project: Distribuidora Frontend - MVP Mostrador
ui_contract: Angular Material 3 + CDK, componentes configurables, mobile-first
---

# 07 - Arquitectura de componentes, estética y UX

## Objetivo no negociable

El sitio debe construirse como un sistema de componentes coherente, no como páginas aisladas. Texto, tono, variante, icono, tamaño, estado y comportamiento se configuran mediante APIs tipadas; las features no copian markup ni inventan estilos para cambiar la apariencia de un control.

La reutilización tiene dos niveles:

1. **Primitivas del sistema visual:** se crean en F0 porque garantizan consistencia, accesibilidad y comportamiento común.
2. **Componentes de dominio:** permanecen dentro de la feature y se promueven a `shared` solo después de dos usos reales y sin llevar reglas de negocio.

No se envuelve cada control Material. Una abstracción compartida se justifica solo cuando concentra comportamiento verificable: loading, prevención de doble click, permisos, accesibilidad, formato, estados, telemetría segura o responsive.

## Capas de composición

```text
Material/CDK
  -> shared/ui primitives
    -> shared/patterns
      -> feature/ui presentational components
        -> feature/pages containers
```

- `pages`: conectan ruta, facade/store, permisos y navegación. No contienen detalle visual repetitivo.
- `feature/ui`: componentes presentacionales, reciben datos por inputs tipados y emiten intención por outputs.
- `feature/data-access`: adapters, stores y mappers. Nunca depende de componentes.
- `shared/ui`: primitivas sin negocio.
- `shared/patterns`: composiciones genéricas demostradas, sin DTOs del backend.

## API obligatoria del botón

Crear una primitiva standalone, por ejemplo `UiButtonComponent`, sobre Angular Material. Su consumidor configura el control, no modifica su CSS.

```ts
type UiButtonVariant = 'filled' | 'outlined' | 'text';
type UiButtonTone = 'primary' | 'neutral' | 'danger';
type UiButtonSize = 'compact' | 'comfortable';

interface UiButtonContract {
  label: string;
  variant?: UiButtonVariant;
  tone?: UiButtonTone;
  size?: UiButtonSize;
  icon?: string;
  iconPosition?: 'start' | 'end';
  type?: 'button' | 'submit';
  loading?: boolean;
  disabled?: boolean;
  permission?: string;
  ariaLabel?: string;
}
```

Reglas:

- El texto se recibe como input o contenido proyectado; nunca se duplica el componente para cambiarlo.
- El color se expresa con `tone` semántico, no con hex, nombre CSS o clases arbitrarias.
- `loading` deshabilita nuevos clicks, conserva ancho razonable y anuncia el estado.
- `danger` requiere texto/iconografía inequívoca y se usa solo en acciones destructivas.
- Para un botón solo icono, crear `UiIconButtonComponent` con `ariaLabel` obligatorio.
- No exponer `style`, clases internas ni propiedades Material sin una necesidad de producto.
- Los permisos controlan visibilidad/habilitación de la acción para UX, sin sustituir al backend.

## Catálogo mínimo de primitivas F0

| Componente | Configuración pública esencial | Responsabilidad |
|---|---|---|
| `ui-button` | label, icon, variant, tone, size, loading, disabled, permission | acción consistente y accesible |
| `ui-icon-button` | icon, ariaLabel, tone, loading, permission | acción compacta |
| `ui-page-header` | title, subtitle, breadcrumbs, actions | jerarquía y acciones de página |
| `ui-action-bar` | primary/secondary actions, sticky mode | acciones adaptativas por viewport |
| `ui-status-chip` | label, semantic status, icon | estado con texto + icono + color |
| `ui-alert` | tone, title, message, action, correlationId | error/advertencia/éxito accionable |
| `ui-loading-state` | label, mode | carga accesible y estable |
| `ui-empty-state` | title, description, icon, action | vacío útil, no decorativo |
| `ui-error-state` | message, retry, correlationId | recuperación y soporte |
| `ui-money` | amount, currency | formato visual, nunca cálculo contable |
| `ui-date-time` | value, format | zona/locale coherentes |
| `ui-confirm-dialog` | title, message, confirmLabel, tone | confirmación breve y foco correcto |
| `ui-responsive-data-view` | columns, card template, row actions, state | tabla escritorio + lista/cards móvil |
| `ui-search-field` | value, label, placeholder, debounce policy | búsqueda accesible y cancelable |
| `ui-filter-panel` | form, active count, apply/clear | filtros persistentes y responsive |
| `ui-permission` | permission, fallback | composición declarativa de visibilidad |

No crear un “mega componente” de formulario que reciba cualquier esquema. Los controles Material se componen directamente en formularios tipados; se comparten validadores, mensajes y layouts cuando su semántica sea transversal.

## Patrones compartidos

Crear solo al aparecer dos usos comprobables:

- `EntityListShell`: encabezado, filtros, data view, paginación, estados y acción alta.
- `EntityEditorShell`: título, formulario proyectado, dirty state y action bar.
- `EntitySelector`: autocomplete con búsqueda remota, selección tipada, loading y empty state.
- `DocumentStatusTimeline`: estados y eventos de compra, venta, recepción o ajuste.
- `CancellationFlow`: selección de motivo, consecuencias, confirmación y resultado.
- `OperationResult`: folio, estado, resumen, correlationId e imprimir/nueva operación.

Cada patrón debe aceptar ViewModels y configuración; nunca DTOs generados directamente.

## Contrato de componentes de feature

Todo componente presentacional:

- tiene una sola responsabilidad visible;
- usa inputs/outputs tipados o APIs Signal estables del baseline;
- no inyecta `HttpClient`, cliente generado ni store de otra feature;
- no conoce rutas salvo que su responsabilidad sea navegación;
- ofrece loading, disabled y empty state cuando corresponda;
- conserva semántica, foco y teclado;
- tiene prueba de contrato para variantes relevantes;
- usa `OnPush` y datos inmutables;
- no excede una complejidad que impida entenderlo de una lectura; dividir por responsabilidades, no por número arbitrario de líneas.

## Customización permitida

```text
Sí:
label/texto
icono del catálogo aprobado
tone semántico
variant y size definidos
loading/disabled
density global
contenido proyectado en slots documentados
orden/composición por layout

No:
hex/rgb por feature
CSS que penetra internals de Material
clases “especiales” por pantalla
copiar un componente para cambiar texto/color
inputs genéricos de estilo
condicionales de negocio dentro de shared/ui
```

Si una variante no existe, primero se evalúa si es una necesidad transversal. Si lo es, se añade al contrato con tokens, prueba y documentación; si es de dominio, se compone dentro de la feature.

## Estética del producto

La interfaz debe sentirse rápida, sobria y confiable:

- jerarquía visual clara: una acción primaria por contexto;
- superficies y elevaciones discretas; evitar “tarjetas dentro de tarjetas”;
- espacio basado únicamente en tokens;
- ancho de lectura contenido en formularios y detalles; ancho operativo en POS/tablas;
- tipografía legible y números/importes alineados;
- densidad cómoda por defecto y compacta solo en superficies de alta operación;
- iconos siempre acompañados de tooltip o nombre accesible cuando no haya texto;
- microcopy concreta: verbo + resultado (`Guardar cliente`, `Confirmar venta`);
- skeleton solo cuando evita salto visual; spinner para acciones puntuales;
- animaciones breves, funcionales y respetando `prefers-reduced-motion`;
- estados vacío/error con siguiente acción clara;
- éxito visible sin bloquear la continuidad del trabajo.

No usar decoración, gradientes, sombras o color para compensar una jerarquía deficiente. Material 3 y los tokens del producto definen la identidad.

## Diseño intuitivo

- La navegación se organiza por tareas de negocio, no por nombres de controladores.
- Clientes, proveedores, productos y demás maestros tienen rutas y ownership separados.
- La acción primaria permanece en una ubicación consistente.
- Acciones peligrosas se separan visualmente y requieren confirmación proporcional al riesgo.
- Filtros activos son visibles, se pueden limpiar y sobreviven en query params cuando favorece el retorno.
- Un error explica qué ocurrió, qué se conservó y qué puede hacer la persona.
- Al volver de detalle/edición se preservan filtros, página y posición cuando sea razonable.
- La app no muestra conceptos técnicos salvo en vistas de soporte autorizadas.

## F0 - Galería y prueba del sistema

Antes de F01, crear una ruta de desarrollo no publicada o harness de componentes que muestre:

- todas las variantes y estados de cada primitiva;
- tema, tipografía, spacing y estados semánticos;
- 320 px, tableta y escritorio;
- teclado, foco, contraste y zoom;
- textos cortos, largos, importes y errores.

No agregar Storybook u otra dependencia sin ADR. El harness Angular + tests de componente es suficiente para el baseline.

## Definition of Done de composición

```text
[ ] no hay botones de acción ad hoc cuando aplica ui-button/ui-icon-button
[ ] texto, tono, variante e icono se configuran por API tipada
[ ] no hay colores, spacing, radios o sombras hardcodeados en features
[ ] page/container y componentes presentacionales están separados
[ ] componentes de feature no realizan HTTP
[ ] no hay duplicación visual o conductual entre dos features
[ ] shared/ui no contiene reglas ni DTOs de negocio
[ ] cada variante tiene estado normal, hover, focus, pressed, loading y disabled
[ ] layout y acciones funcionan desde 320 px
[ ] pruebas de componentes cubren inputs, outputs, teclado y accesibilidad
[ ] la galería/harness refleja el contrato vigente
```

