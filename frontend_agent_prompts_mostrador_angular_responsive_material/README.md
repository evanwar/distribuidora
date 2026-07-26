# Prompts de agentes frontend — Distribuidora MVP Mostrador

Paquete de instrucciones Markdown para coordinar el desarrollo del frontend Angular del sistema de ventas por mostrador.

## Inicio rápido

1. Leer `00_ORQUESTADOR.md`.
2. Leer `AGENTS.md`.
3. Leer `05_DESIGN_SYSTEM_MATERIAL_RESPONSIVE.md`.
4. Leer `06_MATRIZ_ENDPOINTS_FRONTEND.md` y `07_ARQUITECTURA_COMPONENTES_UX.md`.
5. Ejecutar `workflows/WF01_bootstrap_frontend.md`.
6. Implementar los módulos en el orden del `MANIFEST.md`.
7. Para cada tarea, usar `templates/TEMPLATE_PROMPT_SLICE.md`.
8. Cerrar cambios visuales con `workflows/WF06_validacion_material_responsive.md`.
9. Cerrar cada módulo con `workflows/WF07_auditoria_composicion_ux.md`.

## Alcance

Este paquete no incluye código de aplicación. Define prompts, reglas, skills, módulos, workflows y criterios de aceptación para agentes.

No incluye distribución, rutas, camiones, choferes de reparto ni GPS.

## Baseline

Angular 21.x se fija como baseline inicial por compatibilidad del generador TypeScript Angular. La actualización major requiere ADR y validación de CI.


## Contrato visual

La aplicación debe usar Angular Material 3 + CDK como único sistema visual y ser completamente responsive desde 320 px hasta escritorio amplio. No se acepta funcionalidad exclusiva de escritorio ni overflow horizontal global.

## Cobertura e integración

El plan clasifica las **109 operaciones** del backend en `06_MATRIZ_ENDPOINTS_FRONTEND.md`. Cada slice debe marcar operaciones, adapters, superficies UI y pruebas; tener el método en el cliente generado no cuenta como integración.

El contrato de composición está en `07_ARQUITECTURA_COMPONENTES_UX.md`: las primitivas visuales se configuran con inputs tipados y tokens semánticos. No se duplican botones, estados, listados o patrones solo para cambiar texto, color o distribución.
