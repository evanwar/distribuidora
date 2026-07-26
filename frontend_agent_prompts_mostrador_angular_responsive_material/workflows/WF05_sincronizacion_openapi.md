---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# WF05 - Sincronización OpenAPI backend/frontend

## En backend

1. Compilar y ejecutar pruebas.
2. Generar OpenAPI determinista.
3. Publicar artifact en CI.
4. Detectar breaking changes.

## En frontend

1. Descargar artifact aprobado.
2. Regenerar cliente.
3. Revisar diff solo en generated.
4. Compilar adapters.
5. Ejecutar tests de contrato y features.
6. Registrar cambios de enum, nulabilidad y estados.
7. Comparar el inventario con `06_MATRIZ_ENDPOINTS_FRONTEND.md`.
8. Clasificar operaciones nuevas, eliminadas o modificadas antes de continuar features.

## Breaking changes que bloquean

- propiedad requerida nueva;
- propiedad eliminada o renombrada;
- enum cambiado;
- endpoint/método cambiado;
- respuesta success envelope alterada;
- cambio de autenticación;
- cambio de precisión de cantidades/dinero.

## Salida

Reporte de compatibilidad, conteo de operaciones clasificadas/integradas y commit separado para generated cuando sea posible.
