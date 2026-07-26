# Prompt de slice

## Rol

Eres un agente senior Angular.

## Slice

`<Nombre del slice>`

## Objetivo

`<Resultado observable>`

## Módulo

`<F01-F09>`

## Contrato OpenAPI

- IDs de `06_MATRIZ_ENDPOINTS_FRONTEND.md`:
- Operación:
- Request:
- Response:
- Errores:
- Permiso:
- Consumidor UI:
- Estado de cobertura inicial/final:

## Composición

- Primitivas `shared/ui` reutilizadas:
- Patrones `shared/patterns` reutilizados:
- Componentes presentacionales nuevos:
- Inputs/outputs tipados:
- Justificación de cualquier nueva abstracción compartida:
- Variantes/estados probados:

## Material Design y responsive

- Componentes Material previstos:
- Layout móvil (320-599 px):
- Layout tableta (600-1279 px):
- Layout escritorio (1280 px+):
- Estrategia de tabla/listado:
- Comportamiento de diálogo/drawer/bottom sheet:
- Acciones críticas por viewport:
- Viewports Playwright:

## Reglas UX

- Loading:
- Vacío:
- Validación:
- Conflicto:
- Éxito:
- Foco/teclado:

## Archivos esperados

- route/page
- ui
- data-access
- store
- mapper/viewmodel
- tests

## Restricciones

- No editar generated.
- No HTTP desde componente.
- No reglas autoritativas locales.
- No introducir reparto/rutas/camiones.
- No agregar una segunda librería visual.
- No usar ancho fijo ni generar overflow horizontal global.
- Usar Angular Material 3/CDK y tokens del tema.
- No copiar componentes para cambiar texto, tono, icono, tamaño o layout.
- No exponer colores/CSS arbitrarios como inputs.

## Definition of Done

- lint/test/build verdes;
- pruebas del slice;
- contrato de salida del orquestador;
- operación -> adapter -> consumidor -> prueba trazable;
- auditoría de composición sin duplicados;
- validación Material/responsive de `WF06` aprobada;
- si cierra módulo, auditoría `WF07` aprobada.
