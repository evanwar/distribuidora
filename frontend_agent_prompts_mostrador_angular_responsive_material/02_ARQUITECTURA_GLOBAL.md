---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# 02 - Arquitectura global frontend

## Estilo

Usar una **SPA Angular única**, feature-first y con slices verticales. No crear microfrontends ni múltiples aplicaciones para el MVP.

## Bootstrap

- Componentes standalone.
- `bootstrapApplication` y `ApplicationConfig`.
- Rutas lazy con `loadComponent` y/o `loadChildren`.
- `provideHttpClient` con interceptores funcionales.
- Change detection moderna y APIs estables de Angular 21.

## Arquitectura visual y responsive

La responsividad es una restricción arquitectónica, no una corrección final de CSS.

- Angular Material 3 + CDK es el sistema visual único.
- El tema y los design tokens viven en infraestructura visual compartida; las features no definen paletas independientes.
- Las primitivas visuales configurables viven en `shared/ui`; los patrones genéricos demostrados viven en `shared/patterns`.
- Definir breakpoints/tokens en un único lugar.
- CSS resuelve layout; `BreakpointObserver` resuelve cambios reales de comportamiento.
- El shell, overlays, tablas, formularios y estación de venta deben tener contratos explícitos por móvil/tableta/escritorio.
- Ninguna feature puede asumir viewport fijo.
- No crear un “frontend móvil” separado: la misma SPA responde progresivamente.

Estructura sugerida:

```text
src/app/core/layout/
src/app/core/responsive/
src/app/shared/ui/
src/app/shared/patterns/
src/styles/
  _theme.scss
  _tokens.scss
  _responsive.scss
```

Leer `05_DESIGN_SYSTEM_MATERIAL_RESPONSIVE.md` antes de modificar UI.

## Dependencias permitidas

```text
app shell -> core, shared, feature routes
feature -> shared, core abstractions, api adapters propios
shared -> Angular/CDK/Material y utilidades sin negocio
core -> infraestructura transversal, nunca importa features
api/generated -> no importa código manual del proyecto
```

## Dependencias prohibidas

```text
core -> features
shared -> features
feature A -> internals de feature B
component -> HttpClient o API generated directamente
feature -> ruta profunda de otra feature
```

Cuando una feature necesita datos de otra, usar un contrato público, facade o API backend; no reutilizar su store interno.

## Estructura por feature

```text
features/counter-sales/
  counter-sales.routes.ts
  pages/
    sale-workspace/
    sale-detail/
    sale-list/
  ui/
    product-search/
    sale-cart/
    payment-dialog/
  data-access/
    counter-sales.api-adapter.ts
    counter-sales.store.ts
  models/
    counter-sale.vm.ts
    counter-sale.mapper.ts
  validators/
  testing/
```

## Vertical Slice UI

Cada historia debe implementarse de extremo a extremo. Ejemplo:

```text
ConfirmCounterSale
  route/page action
  confirmation dialog
  request mapping
  API operation
  loading/error/success state
  permission check
  focus restoration
  unit/component/E2E tests
```

No crear primero todas las páginas, después todos los servicios y al final las pruebas.

## Estado

- Signals para estado síncrono local y de feature.
- `computed` para datos derivados.
- RxJS para HTTP, debounce, cancelación, combinación temporal y eventos externos.
- Stores pequeños por feature, no un store global monolítico.
- Estado global solo para sesión, permisos, configuración y shell.

## API

El código generado se coloca en:

```text
src/app/core/api/generated/
```

El código manual consume adapters:

```text
src/app/core/api/adapters/
features/<feature>/data-access/
```

Regla: generated -> adapter -> store/facade -> page/component.

## UI y estilos

- Angular Material y CDK como base.
- Un solo sistema de tokens y tema Material 3.
- SCSS o CSS moderno de forma consistente.
- No mezclar Tailwind con Material en el MVP.
- Las primitivas obligatorias descritas en `07_ARQUITECTURA_COMPONENTES_UX.md` se crean en F0.
- Los componentes de dominio se comparten solo después de existir dos usos reales y perder toda dependencia de negocio.
- Una page/container puede conocer store/facade; un componente presentacional solo recibe ViewModels/configuración y emite intención.
- No exponer inputs de CSS arbitrario. Variantes visuales mediante tipos y tokens semánticos.

## Routing

- Cada feature tiene su archivo `.routes.ts`.
- Guards funcionales para autenticación y permisos.
- Resolver solo cuando mejore la navegación; preferir carga explícita y skeleton.
- Preservar filtros útiles en query params.

## ADR obligatorios

Registrar una decisión cuando se proponga:

- nueva dependencia npm relevante;
- cambio de versión major;
- NgRx u otro store global;
- SSR/PWA/offline;
- segunda librería de componentes;
- microfrontend;
- cambio de estrategia de autenticación.
