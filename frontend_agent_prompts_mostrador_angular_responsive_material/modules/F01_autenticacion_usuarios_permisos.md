---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# F01 - Autenticación, usuarios y permisos

## Prompt del agente

```text
Implementa con Angular Material 3 y diseño mobile-first 100% responsive el shell autenticado del sistema Angular: login, sesión, renovación, logout, navegación por permisos y administración mínima de usuarios/roles. No confíes en el frontend para autorizar; solo refleja el contrato del backend.
```

## Dependencias

Sprint F0 completado y contrato OpenAPI de seguridad disponible.

## Objetivo

Permitir acceso seguro, mantener sesión, proteger rutas y ocultar acciones no disponibles sin generar falsas garantías.

## Slices mínimos

- Login.
- Restaurar sesión.
- Refresh coordinado sin múltiples solicitudes paralelas.
- Logout.
- Access denied.
- Perfil/usuario actual.
- Listado y creación de usuarios si backend lo expone.
- Asignación de roles/permisos.

## Rutas sugeridas

```text
/login
/forbidden
/admin/users
/admin/users/:id/roles
```

## Estado mínimo

```text
anonymous | authenticating | authenticated | refreshing | expired | error
```

## Reglas UX y seguridad

- No guardar refresh token en localStorage.
- No mostrar el shell protegido antes de resolver sesión.
- Un 401 puede disparar un solo intento de refresh coordinado.
- Un 403 no dispara refresh.
- Redirigir al destino original después de login cuando sea seguro.
- No incluir permisos administrativos en bundles de reglas locales como sustituto del servidor.

## Permisos UI esperados

- security.users.view
- security.users.create
- security.users.assign_roles
- security.audit.view

## Pruebas críticas

- login exitoso redirige.
- credenciales inválidas muestran error.
- refresh concurrente se ejecuta una vez.
- ruta protegida bloquea usuario sin sesión.
- acción se oculta sin permiso.
- 403 muestra pantalla adecuada.

## Contrato Material y responsive

- Login con `mat-card`/superficie Material fluida: ancho completo en móvil y ancho máximo legible en escritorio.
- Formularios a una columna en todos los tamaños; no justificar grid complejo.
- Administración de usuarios: tabla Material en escritorio y lista/card con menú de acciones en móvil.
- Asignación de roles/permisos: diálogo fullscreen o página dedicada en móvil.
- Sidenav protegido en modo `over` en móvil y persistente/colapsable en escritorio.
- Probar 320 px, tableta y escritorio, incluyendo teclado virtual en login.

## Reglas de implementación

- Crear rutas lazy.
- Consumir API mediante adapter y cliente generado.
- Usar Signals para estado de feature.
- Usar Reactive Forms tipados cuando exista captura.
- Implementar loading, vacío, error, éxito y forbidden.
- Aplicar permisos en rutas y acciones.
- No duplicar reglas autoritativas del backend.
- Agregar pruebas unitarias/componentes y E2E crítico.

## Contrato de entrega

```text
[ ] route/slice implementado
[ ] componentes Angular Material accesibles
[ ] comportamiento responsive móvil/tableta/escritorio validado
[ ] sin overflow horizontal global
[ ] store/facade implementado
[ ] adapter OpenAPI implementado
[ ] validaciones implementadas
[ ] permisos aplicados
[ ] errores y correlationId manejados
[ ] tests agregados
[ ] ng test pasa
[ ] ng build pasa
```

## Endpoints obligatorios y cobertura

Integrar las 11 operaciones `AUT-01..AUT-03`, `USR-01..USR-04`, `ROL-01..ROL-03` y `PER-01` definidas en `../06_MATRIZ_ENDPOINTS_FRONTEND.md`.

Distribución por slice:

- sesión: login, refresh coordinado y logout;
- usuarios: lista, alta, edición y asignación de roles;
- roles: lista, alta y matriz de permisos;
- permisos: catálogo autoritativo para UI y administración.

No persistir refresh token en `localStorage`. Refresh y logout son consumidores transversales de sesión, pero siguen contando con adapter y pruebas de contrato.

## Composición mínima

- `login-form`, `session-expired-notice`;
- `user-list`, `user-editor`, `user-role-editor`;
- `role-list`, `role-editor`, `role-permission-matrix`;
- primitivas `ui-button`, `ui-alert`, `ui-loading-state`, `ui-page-header`, `ui-action-bar` y `ui-responsive-data-view`.

Pages conectan facades; los componentes anteriores reciben ViewModels y emiten intenciones. La matriz de permisos debe ser accesible, searchable y responsive, no una tabla rígida.
