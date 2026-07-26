---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# WF04 - Pruebas y criterios de aceptación

## Por slice

- Renderiza estado inicial.
- Muestra loading.
- Renderiza éxito.
- Renderiza vacío.
- Maneja validación.
- Maneja 401/403/409/5xx.
- Respeta permisos.
- No duplica mutación.
- Es navegable con teclado.
- Usa componentes/tokens Material aprobados.
- No presenta overflow horizontal global.
- Mantiene acciones y contenido críticos en móvil, tableta y escritorio.
- Formularios, tablas y overlays se adaptan al viewport.

## E2E prioritarios

```text
login
crear producto
recepción de mercancía
consulta de stock/kardex
venta contado
venta crédito
registro de pago
cancelación autorizada
auditoría
```

## Matriz responsive mínima

Todo flujo crítico se ejecuta al menos en un proyecto Playwright móvil y uno de escritorio; el punto de venta también en tableta. Usar como referencia `WF06_validacion_material_responsive.md`.

## Criterios globales

- Sin errores de consola en flujos felices.
- Sin llamadas duplicadas inesperadas.
- Sin textos de error técnico expuestos.
- Foco visible y restaurado.
- Build de producción en verde.
- Cliente OpenAPI sin cambios manuales.
- Angular Material/CDK es el único sistema visual.
- Sin pérdida funcional a 320 px ni zoom 200%.
