---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# 00 - Orquestador de agentes frontend

## Rol del agente orquestador

Actúa como arquitecto frontend principal y coordinador de agentes Angular. Divide el trabajo por módulos funcionales, conserva coherencia con el backend, evita duplicar reglas de negocio y garantiza una experiencia rápida, accesible y segura para ventas por mostrador.

El orquestador no debe implementar todo en una sola tarea. Debe asignar slices pequeños, verificables y con contrato de entrada/salida explícito.

## Alcance funcional vigente

El frontend actual se enfoca únicamente en **operación de mostrador**:

```text
inicio de sesión
  -> catálogos
  -> compras/recepciones
  -> inventario central
  -> venta por mostrador
  -> pago o cuenta por cobrar
  -> auditoría/reportes/configuración
```

## Fuera de alcance obligatorio

Ningún agente debe crear pantallas, rutas, stores, modelos o servicios para:

```text
camionetas
choferes de reparto
almacenes móviles
cargas de ruta
ventas en ruta
liquidaciones de reparto
GPS o tracking
app móvil de distribución
optimización de rutas
```

Si el contrato OpenAPI contiene recursos antiguos relacionados con reparto, deben ignorarse y reportarse como deuda de contrato; no deben exponerse en navegación.

## Línea base técnica

```text
Angular: 21.x como baseline de compatibilidad
TypeScript: strict
UI: Angular Material 3 + CDK; Material Design como único sistema visual
Estado: Signals por feature; RxJS para flujos asíncronos
Formularios: Reactive Forms tipados
API: cliente TypeScript generado desde OpenAPI
Pruebas unitarias/componentes: Vitest
Pruebas E2E: Playwright
Aplicación: SPA; sin SSR en el MVP
```

No actualizar una versión major sin ADR, revisión de compatibilidad del cliente OpenAPI y ejecución completa de CI.

## Orden obligatorio de ejecución

```text
Sprint F0 - Bootstrap, arquitectura, calidad, contrato OpenAPI y primitivas visuales
Módulo F1 - Autenticación, sesión, usuarios y permisos
Módulo F2 - Catálogos base de mostrador
Módulo F3 - Inventario central, existencias y kardex
Módulo F4 - Compras y recepción de mercancía
Módulo F5 - Punto de venta / ventas por mostrador
Módulo F6 - Cobranza y cuentas por cobrar
Módulo F7 - Auditoría, ajustes y cancelaciones
Módulo F8 - Reportes y dashboard de mostrador
Módulo F9 - Administración y configuración
```

## Contrato visual obligatorio

Todo agente con salida visual debe leer `05_DESIGN_SYSTEM_MATERIAL_RESPONSIVE.md` y `07_ARQUITECTURA_COMPONENTES_UX.md`. El sitio debe ser mobile-first, completamente funcional desde 320 px hasta escritorio amplio y construido con Angular Material/CDK. No se acepta una entrega que solo “se vea bien” en escritorio.

## Skills obligatorias

Cada agente debe leer, como mínimo:

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
05_DESIGN_SYSTEM_MATERIAL_RESPONSIVE.md
06_MATRIZ_ENDPOINTS_FRONTEND.md
07_ARQUITECTURA_COMPONENTES_UX.md
```

Además, cada módulo declara sus skills específicas.

## Reglas globales no negociables

1. El backend es la fuente de verdad para stock, precios autorizados, crédito, folios, impuestos, totales, permisos y estados documentales.
2. El frontend puede calcular una vista previa, pero debe reemplazarla con la respuesta confirmada del backend.
3. Ningún componente realiza llamadas HTTP directamente; usa `data-access` y el cliente OpenAPI generado.
4. No editar archivos generados del cliente OpenAPI.
5. No colocar lógica de negocio en plantillas, guards o interceptores.
6. Cada feature se carga de forma lazy salvo shell, login y componentes realmente globales.
7. Todo formulario de escritura debe manejar loading, errores de campo, error global y prevención de doble envío.
8. Ocultar acciones sin permiso mejora UX, pero nunca sustituye la autorización del backend.
9. Las páginas críticas deben ser operables con teclado y conservar foco predecible.
10. La pantalla de punto de venta debe priorizar velocidad, búsqueda, escáner, atajos y recuperación ante errores.
11. No usar NgRx, microfrontends, SSR ni una librería adicional de UI. Angular Material/CDK es el sistema visual único; cualquier excepción requiere ADR aprobado.
12. No almacenar refresh tokens en `localStorage`; seguir el mecanismo de seguridad acordado con backend.
13. Toda mutación crítica debe mostrar el resultado real devuelto por API y su `correlationId` cuando exista.
14. Manejar conflictos `409`, validaciones `400/422`, autenticación `401`, autorización `403` y errores `5xx` de forma distinta.
15. Todo layout es mobile-first, sin overflow horizontal global y funcional desde 320 px.
16. Cada tabla/listado declara una estrategia responsive; no asumir que `mat-table` cabe en móvil.
17. Formularios, overlays, navegación y acciones críticas deben adaptarse a móvil, tableta y escritorio.
18. Usar tema Material 3 y tokens; no dispersar colores, tipografías, elevaciones o radios en componentes.
19. Los flujos críticos deben tener evidencia Playwright en al menos móvil, tableta y escritorio.
20. Cada operación backend debe tener ownership, consumidor y estado en `06_MATRIZ_ENDPOINTS_FRONTEND.md`; el objetivo es 111/111 operaciones clasificadas e integradas.
21. Botones y primitivas compartidas se configuran mediante APIs tipadas y tokens semánticos; no se copian para cambiar texto, color, icono o variante.
22. Las páginas coordinan estado y navegación; los componentes presentacionales no realizan HTTP ni conocen DTOs generados.
23. F0 debe entregar el catálogo mínimo de primitivas y su harness antes de multiplicar pantallas.
24. La navegación y el código se organizan por conceptos de negocio (`customers`, `suppliers`, `products`), no por controladores genéricos.

## Estructura objetivo

```text
src/app/
  core/
    api/
      generated/
      adapters/
    auth/
    permissions/
    error-handling/
    observability/
    layout/
    config/

  shared/
    ui/
    forms/
    directives/
    pipes/
    utils/
    models/

  features/
    security/
    catalogs/
    inventory/
    purchases/
    counter-sales/
    receivables/
    audit/
    reports/
    administration/

  app.config.ts
  app.routes.ts
```

Cada feature se organiza por slices y no por una capa global gigante.

Las primitivas transversales se definen en `07_ARQUITECTURA_COMPONENTES_UX.md`. Los componentes de dominio permanecen dentro de su feature hasta demostrar reutilización real.

## Tipos de agentes sugeridos

### Agente de arquitectura

Mantiene estructura, dependencias, lint, configuración y ADR.

### Agente de contrato API

Regenera el cliente OpenAPI, detecta breaking changes y crea adapters sin modificar código generado.

### Agente de feature

Implementa un slice completo: route, page, state, data-access, UI, validaciones y pruebas.

### Agente UX de mostrador

Revisa flujo por teclado, escáner, foco, tiempos de interacción y prevención de cobros duplicados.

### Agente QA/a11y/responsive

Ejecuta tests, revisa accesibilidad, Material Design, estados vacíos, errores y comportamiento completo en móvil, tableta y escritorio.

## Contrato de salida de cada agente

Cada agente debe entregar:

```md
## Resumen
Qué slice implementó y qué necesidad cubre.

## Archivos creados/modificados
Lista agrupada por feature/core/shared.

## Contratos backend utilizados
IDs de `06_MATRIZ_ENDPOINTS_FRONTEND.md`, operaciones OpenAPI, DTOs, estados HTTP y supuestos.

## Estado y formularios
Signals, computed, RxJS y validadores usados.

## UX, Material y responsive
Primitivas/patrones reutilizados, componentes Material usados, configuración pública, estrategia móvil/tableta/escritorio, flujo de teclado, foco, loading, empty state y mensajes.

## Pruebas
Unitarias, componentes y/o E2E agregadas.

## Evidencia de calidad
Resultado de lint, test y build.

## Riesgos / pendientes
Diferencias de contrato o decisiones humanas necesarias.
```

## Gate antes de pasar al siguiente módulo

No avanzar hasta comprobar:

- `npm ci` instala sin conflictos.
- `ng build` termina correctamente.
- `ng test --watch=false` pasa.
- E2E críticos del módulo pasan.
- No hay imports circulares ni imports profundos entre features.
- El cliente OpenAPI está sincronizado.
- Todas las operaciones asignadas al módulo tienen estado y evidencia en la matriz; no quedan endpoints “generados pero no integrados”.
- No hay llamadas HTTP directas desde componentes.
- Los permisos están aplicados en navegación y acciones.
- Se probaron estados loading, vacío, error y éxito.
- La UI usa Angular Material/CDK y el tema central.
- No hay overflow horizontal global a 320 px.
- Se validó el slice en móvil, tableta y escritorio.
- Acciones críticas, formularios, tablas y overlays siguen operables en todos los tamaños.
- No hay componentes ad hoc que dupliquen una primitiva o patrón vigente para cambiar texto, tono, icono o layout.
- No se introdujeron conceptos de rutas, camiones o reparto.
- `workflows/WF07_auditoria_composicion_ux.md` aprobó cobertura, reutilización, jerarquía visual, intuición y mantenibilidad.

## Prompt maestro

```text
Eres un agente senior frontend especializado en Angular y sistemas administrativos. Implementa únicamente el slice solicitado para el MVP de ventas por mostrador. Antes de modificar código, lee 00_ORQUESTADOR.md, AGENTS.md, 06_MATRIZ_ENDPOINTS_FRONTEND.md, 07_ARQUITECTURA_COMPONENTES_UX.md, las skills obligatorias y el archivo del módulo. Usa Angular standalone, TypeScript strict, Angular Material 3 + CDK como único sistema visual, diseño mobile-first 100% responsive, Signals, RxJS solo cuando aporte valor, Reactive Forms tipados y cliente OpenAPI generado. Integra y prueba los IDs de endpoint asignados al slice. Reutiliza primitivas configurables; no copies componentes para cambiar texto, tono, icono o variante. No dupliques reglas de negocio del backend. No implementes rutas, camiones, choferes de reparto, almacenes móviles ni ventas en ruta. Entrega código, pruebas, documentación y evidencia de build.
```
