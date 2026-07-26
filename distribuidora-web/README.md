# Distribuidora Web

SPA Angular 21 para operación de mostrador, construida con Angular Material 3, Signals, RxJS, formularios reactivos tipados y cliente Angular generado desde OpenAPI.

## Requisitos

- Node.js 24 compatible con Angular 21.
- API `Distribuidora.Api` disponible en `http://localhost:8080`.
- PostgreSQL configurado por el backend.

## Comandos

```bash
npm install
npm start
npm run lint
npm test
npm run build
npm run e2e
```

El servidor de desarrollo usa `proxy.conf.json` y envía `/api` a `http://localhost:8080`.

## Contrato OpenAPI

El snapshot autoritativo se conserva en `openapi/distribuidora.v1.json`.

```bash
npm run api:generate
npm run api:catalog
```

- `api:generate` genera 56 modelos y 30 servicios en `src/app/core/api/generated`.
- `api:catalog` valida y genera el inventario de 109 operaciones desde la matriz del plan.
- Nunca se modifica manualmente `core/api/generated`.
- Los adapters de feature aíslan pages/stores del código generado.

La elección de generador está documentada en `docs/adr/ADR-001-generador-openapi-sin-java.md`.

## Arquitectura

```text
src/app/
  core/
    api/
      generated/
    auth/
    error-handling/
    layout/
    permissions/
  shared/
    ui/
    patterns/
  features/
    customers/
    suppliers/
    products/
    masters/
    dashboard/
    operations/
    security/
    design-system/
```

Las pages coordinan estado. Los stores/adapters realizan integración. Los componentes presentacionales reciben ViewModels/configuración tipada y emiten intención.

## Rutas principales

```text
/login
/dashboard
/customers
/suppliers
/products
/masters
/operations/security
/operations/inventory
/operations/purchases
/operations/counter-sales
/operations/receivables
/operations/audit
/operations/reports
/operations/administration
/design-system
```

Clientes tiene un slice explícito. Proveedores, productos y maestros sencillos usan un patrón CRUD acotado con selectores remotos para sus relaciones. Punto de venta tiene un flujo especializado; los demás módulos operativos usan workspaces guiados por tarea de negocio. La interfaz no expone rutas HTTP ni exige capturar JSON.

## Seguridad

- Access token y refresh token permanecen únicamente en memoria.
- El refresh se coordina para evitar solicitudes simultáneas.
- Ningún secreto vive en archivos de environment.
- La autorización real pertenece al backend; la UI solo orienta según claims.

## Calidad

```bash
npm run check
npm run e2e
```

Playwright ejecuta Chromium con perfiles móvil, tableta y escritorio. Los E2E validan login, navegación autenticada, punto de venta, workspaces guiados y ausencia de overflow horizontal.
