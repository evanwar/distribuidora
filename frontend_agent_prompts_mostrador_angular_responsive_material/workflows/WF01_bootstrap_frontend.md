---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# WF01 - Bootstrap del frontend

## Objetivo

Crear el workspace y dejar una base compilable antes de features.

## Secuencia

1. Verificar versiones de Node, Angular CLI y TypeScript.
2. Crear workspace SPA con routing, strict y SCSS/CSS acordado.
3. Instalar Angular Material/CDK.
4. Configurar tema, locale `es-MX` y moneda MXN.
5. Crear estructura `core/shared/features`.
6. Configurar HttpClient e interceptores base.
7. Configurar rutas shell/login/not-found/forbidden.
8. Configurar ESLint y formatter acordado.
9. Confirmar Vitest y cobertura.
10. Configurar Playwright.
11. Crear script de generación OpenAPI.
12. Crear CI: install, lint, test, build, e2e smoke.
13. Implementar las primitivas obligatorias y el harness definidos en `07_ARQUITECTURA_COMPONENTES_UX.md`.
14. Integrar `HLT-01` y preparar el tablero de cobertura de `06_MATRIZ_ENDPOINTS_FRONTEND.md`.
15. Añadir ADR inicial y documentación de comandos.

## Salida

Proyecto vacío pero navegable, con tests y build en verde.


## Bootstrap Material y responsive obligatorio

- Instalar/configurar Angular Material y CDK usando la versión alineada con Angular.
- Crear tema Material 3 centralizado.
- Definir tokens semánticos de spacing, superficies, estados y breakpoints.
- Crear shell responsive con toolbar y sidenav.
- Configurar Playwright con proyectos móvil, tableta y escritorio.
- Agregar una prueba de humo que detecte overflow horizontal global.
- Crear `shared/ui` con botones configurables, estados, action bar, status chip, formatos y data view responsive.
- Crear harness de componentes no publicado con variantes, foco, loading, disabled, errores y textos largos.
- Probar contratos de inputs/outputs y asegurar que features no necesiten CSS ad hoc para personalizar primitivas.
- No instalar otra librería visual.
