---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
ui_contract: Mobile-first, 100% responsive, Angular Material como único sistema visual
---

# WF06 - Validación Material, responsive y accesibilidad

## Propósito

Validar que un slice visual cumple el sistema Material y conserva funcionalidad completa en móvil, tableta y escritorio.

## Paso 1 - Inspección de sistema visual

- Confirmar uso de Angular Material/CDK.
- Confirmar ausencia de una segunda librería visual.
- Confirmar que colores, tipografía, densidad y formas provienen del tema/tokens.
- Confirmar que no se recrearon inputs, botones, tablas o diálogos existentes en Material.
- Confirmar reutilización de primitivas de `07_ARQUITECTURA_COMPONENTES_UX.md`.
- Confirmar que texto, tono, variante, icono y loading se resuelven mediante API tipada y no por CSS/copias.

## Paso 2 - Matriz de viewports

Ejecutar el flujo crítico en:

```text
móvil compacto: 320 × 568
móvil:          390 × 844
tableta vertical: 768 × 1024
tableta horizontal/laptop: 1024 × 768
escritorio:     1366 × 768
escritorio amplio: 1920 × 1080
```

## Paso 3 - Checklist funcional responsive

```text
[ ] no existe overflow horizontal del body
[ ] navegación principal sigue accesible
[ ] acciones primarias siguen visibles/accesibles
[ ] filtros y paginación siguen operables
[ ] tabla/lista utiliza su estrategia responsive declarada
[ ] formularios no cortan campos, labels ni errores
[ ] diálogos/drawers/bottom sheets caben en viewport
[ ] teclado virtual no oculta permanentemente la acción principal
[ ] textos largos e importes no rompen layout
[ ] la orientación horizontal no pierde funciones
[ ] no hay componentes ad hoc equivalentes a una primitiva vigente
[ ] variantes y estados conservan jerarquía visual consistente
```

## Paso 4 - Accesibilidad

- Recorrer el flujo solo con teclado.
- Verificar foco visible y restauración después de overlays.
- Verificar nombre accesible de botones con icono.
- Verificar contraste y estados no dependientes solo del color.
- Probar zoom 200% en una pantalla representativa.

## Paso 5 - Automatización Playwright

Crear proyectos o fixtures para móvil, tableta y escritorio. Los E2E críticos deben validar al menos:

```text
login
navegación/sidenav
listado con filtros
formulario de alta/edición
venta por mostrador
cobro/confirmación
```

Agregar assertions de overflow y disponibilidad de acciones. Utilizar screenshots de referencia solo en pantallas estables y controlar datos/animaciones.

## Salida requerida

```md
## Material Design
Primitivas, componentes Material, configuración pública y tokens utilizados.

## Estrategias responsive
Comportamiento por móvil/tableta/escritorio.

## Viewports probados
Lista y resultado.

## Accesibilidad
Teclado, foco, contraste y zoom.

## Defectos encontrados
Severidad y evidencia.

## Estado
Aprobado o rechazado.
```
