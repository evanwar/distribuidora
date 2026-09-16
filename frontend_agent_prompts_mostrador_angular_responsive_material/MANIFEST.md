---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# Manifest del paquete

## Entrada

- `00_ORQUESTADOR.md`
- `AGENTS.md`
- `README.md`

## Documentos transversales

| Archivo | Propósito |
|---|---|
| `01_CONTEXTO_NEGOCIO_Y_ALCANCE.md` | Negocio, usuarios y límites. |
| `02_ARQUITECTURA_GLOBAL.md` | Estructura feature-first y dependencias. |
| `03_CONVENCIONES_TRANSVERSALES.md` | TypeScript, forms, estados y UI. |
| `04_CONTRATO_INTEGRACION_BACKEND.md` | OpenAPI, errores y sincronización. |
| `05_DESIGN_SYSTEM_MATERIAL_RESPONSIVE.md` | Material Design 3, tokens, mobile-first y contrato responsive. |
| `06_MATRIZ_ENDPOINTS_FRONTEND.md` | Asignación verificable de las 111 operaciones a módulos y superficies UI. |
| `07_ARQUITECTURA_COMPONENTES_UX.md` | Primitivas configurables, patrones, estética y mantenibilidad. |
| `08_IMPLEMENTACION_CORRELATION_ID_FRONTEND.md` | Propagación de CorrelationId y OperationId, UX de referencia, integración y pruebas. |
| `09_IMPLEMENTACION_TUTORIALES_DRIVERJS.md` | Prompt maestro para tutoriales guiados por módulo con Driver.js, permisos, progreso, accesibilidad y pruebas. |

## Módulos

| Módulo | Archivo | Objetivo |
|---|---|---|
| F01 | `modules/F01_autenticacion_usuarios_permisos.md` | Autenticación, sesión y permisos |
| F02 | `modules/F02_catalogos_base_mostrador.md` | Productos, clientes, proveedores y auxiliares |
| F03 | `modules/F03_inventario_existencias_kardex.md` | Inventario central y kardex |
| F04 | `modules/F04_compras_recepcion_mercancia.md` | Compras y recepción |
| F05 | `modules/F05_punto_venta_mostrador.md` | Punto de venta por mostrador |
| F06 | `modules/F06_cobranza_cuentas_por_cobrar.md` | Cobranza y saldos |
| F07 | `modules/F07_auditoria_ajustes_cancelaciones.md` | Auditoría y excepciones |
| F08 | `modules/F08_reportes_dashboard_mostrador.md` | Reportes y dashboard |
| F09 | `modules/F09_administracion_configuracion.md` | Configuración |


## Skills

```text
skills/skill_01_angular_architecture.md
skills/skill_02_feature_vertical_slice.md
skills/skill_03_signals_rxjs_state.md
skills/skill_04_reactive_forms_validation.md
skills/skill_05_openapi_backend_contracts.md
skills/skill_06_auth_security_permissions.md
skills/skill_07_material_accessibility_responsive.md
skills/skill_08_testing_quality.md
skills/skill_09_pos_ux_performance.md
skills/skill_10_error_handling_observability.md
```

## Workflows

```text
workflows/WF01_bootstrap_frontend.md
workflows/WF02_implementacion_slice_por_agente.md
workflows/WF03_flujo_venta_mostrador.md
workflows/WF04_pruebas_criterios_aceptacion.md
workflows/WF05_sincronizacion_openapi.md
workflows/WF06_validacion_material_responsive.md
workflows/WF07_auditoria_composicion_ux.md
```

## Templates

```text
templates/TEMPLATE_PROMPT_SLICE.md
templates/TEMPLATE_GAP_API.md
templates/TEMPLATE_ADR.md
```

## Fuera de alcance

No crear UI ni código para rutas, camiones, choferes de reparto, almacenes móviles, cargas, liquidaciones o GPS.
