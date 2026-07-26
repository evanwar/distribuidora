---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# WF02 - Implementación de un slice por agente

## Entrada

- Historia o caso de uso.
- Archivo de módulo.
- Operación OpenAPI disponible.
- IDs de operación en `06_MATRIZ_ENDPOINTS_FRONTEND.md`.
- Permiso requerido.

## Pasos

1. Leer orquestador, skills y módulo.
2. Confirmar que no está fuera de alcance.
3. Identificar IDs, request/response, errores y consumidor UI; marcar `en progreso`.
4. Inventariar primitivas/patrones existentes antes de diseñar componentes nuevos.
5. Diseñar ViewModel, estado de UI y contratos tipados de componentes.
6. Crear ruta lazy si aplica.
7. Implementar adapter/mappers.
8. Implementar store/facade.
9. Implementar page y componentes presentacionales.
10. Implementar formulario/validaciones.
11. Aplicar permisos.
12. Añadir loading/empty/error/success/conflict.
13. Añadir pruebas HTTP, componente y E2E proporcionales al riesgo.
14. Ejecutar gates de cobertura, composición, Material y responsive.
15. Marcar operaciones `integrado` solo con evidencia.
16. Entregar reporte con contrato de salida.

## Regla de bloqueo

Si el OpenAPI no soporta la historia, crear Gap Report y no inventar solución.


## Paso visual obligatorio

Antes de codificar, declarar:

```text
componentes Angular Material elegidos
primitivas/patrones compartidos reutilizados
configuración pública de componentes nuevos
layout en móvil, tableta y escritorio
estrategia de tabla/listado
comportamiento de diálogo/drawer
acciones críticas y ubicación por viewport
```

Antes de entregar, ejecutar `WF06_validacion_material_responsive.md`.

Rechazar el slice si duplica una primitiva para cambiar texto/color o si deja una operación asignada sin adapter, consumidor y prueba.

Al cerrar el último slice de un módulo, ejecutar `WF07_auditoria_composicion_ux.md`.
