# AGENTS.md

## Entrada obligatoria

Lee en este orden:

1. `00_ORQUESTADOR.md`
2. `01_CONTEXTO_NEGOCIO_Y_ALCANCE.md`
3. `02_ARQUITECTURA_GLOBAL.md`
4. `03_CONVENCIONES_TRANSVERSALES.md`
5. `04_CONTRATO_INTEGRACION_BACKEND.md`
6. `05_DESIGN_SYSTEM_MATERIAL_RESPONSIVE.md`
7. `06_MATRIZ_ENDPOINTS_FRONTEND.md`
8. `07_ARQUITECTURA_COMPONENTES_UX.md`
9. Skills declaradas por el módulo.
10. Archivo del módulo solicitado.

## Conducta del agente

- Implementa slices pequeños y completos.
- No inventes endpoints ni campos del backend.
- Si falta un contrato, detente y crea un reporte de gap.
- No edites código OpenAPI generado.
- No agregues dependencias npm sin justificar y registrar ADR.
- No introduzcas NgRx, SSR, microfrontends o una segunda librería visual. Angular Material/CDK es obligatorio.
- Diseña mobile-first y valida funcionalidad completa desde 320 px.
- No cierres un slice con overflow horizontal global o acciones críticas inaccesibles en móvil.
- Registra cada operación usada y su estado contra `06_MATRIZ_ENDPOINTS_FRONTEND.md`; no declares un módulo completo con endpoints sin integrar.
- Reutiliza las primitivas y contratos de `07_ARQUITECTURA_COMPONENTES_UX.md`; no copies markup/estilos para cambiar texto, tono o variante.
- Ejecuta `workflows/WF06_validacion_material_responsive.md` para cualquier cambio visual.
- Ejecuta `workflows/WF07_auditoria_composicion_ux.md` antes de cerrar un módulo.
- Ejecuta lint, test y build antes de declarar terminado.
- Mantén fuera de alcance rutas, camiones, choferes de reparto y GPS.

## Definition of Done

Un slice está terminado cuando incluye ruta, UI Material componetizada, estado, integración API trazable en la matriz, manejo de errores, permisos, accesibilidad, comportamiento responsive móvil/tableta/escritorio y pruebas suficientes.
