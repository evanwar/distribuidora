---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# 03 - Convenciones transversales

## Nombres

- Archivos y carpetas: kebab-case.
- Clases/tipos: PascalCase.
- Variables y funciones: camelCase.
- Signals privados: prefijo `_` opcional pero consistente.
- Sufijos: `.page.ts`, `.component.ts`, `.store.ts`, `.adapter.ts`, `.mapper.ts`, `.validator.ts`.

## TypeScript

- `strict: true`.
- Evitar `any`; usar `unknown` y narrowing.
- No usar non-null assertion salvo justificación.
- DTO generado no es ViewModel.
- Preferir tipos discriminados para estados de UI.

## Componentes

- Componentes pequeños y enfocados.
- `ChangeDetectionStrategy.OnPush` cuando aplique al baseline.
- Inputs/outputs tipados.
- No suscripciones manuales sin estrategia de destrucción.
- Plantillas sin cálculos complejos ni llamadas a métodos costosos.
- Las pages conectan estado/API mediante facade; los componentes presentacionales son puros respecto de infraestructura.
- Reutilizar `shared/ui` para acciones, estados y formatos transversales.
- Configurar texto, icono, `variant`, `tone`, `size`, loading, disabled y permiso mediante inputs tipados.
- No aceptar colores hex, estilos o clases arbitrarias como API pública de componentes.
- No copiar markup de botones, empty states, alertas o action bars para personalizarlos.
- Promover un componente de dominio a `shared/patterns` solo tras dos usos reales y sin DTOs/reglas de negocio.

## Material Design y responsive

- Angular Material/CDK es obligatorio para controles y patrones visuales cubiertos por la librería.
- No mezclar Bootstrap, Tailwind, PrimeNG u otro sistema de componentes.
- Usar tema Material 3 y tokens semánticos; no hardcodear colores o elevaciones en features.
- Todo layout comienza mobile-first y funciona desde 320 px.
- No usar anchos fijos de pantalla ni `min-width` que provoque overflow global.
- Formularios Material: una columna en móvil y expansión progresiva.
- Tablas/listados: declarar columnas prioritarias, expansión, cards o overflow contenido.
- Overlays largos: fullscreen/página en móvil.
- Objetivos táctiles cercanos a 48 × 48 px.
- Probar móvil, tableta y escritorio antes de cerrar el slice.

## Estados de pantalla

Toda página de datos debe contemplar:

```text
initial
loading
loaded
empty
validation-error
conflict
forbidden
offline/network-error
unexpected-error
```

## Respuestas del backend

Adaptar el envelope esperado:

```json
{
  "success": true,
  "data": {},
  "message": "Operación realizada correctamente",
  "errors": [],
  "correlationId": "..."
}
```

Nunca mostrar al usuario stack traces ni mensajes internos.

## Fechas y dinero

- Mostrar fechas en zona horaria configurada por negocio.
- Transmitir timestamps ISO-8601 sin reinterpretación manual.
- Mostrar moneda MXN con `CurrencyPipe` y locale `es-MX`.
- No usar `number` del frontend como fuente contable autoritativa.
- No redondear totales confirmados por backend.

## Formularios

- Reactive Forms tipados.
- Validación visual después de interacción o intento de envío.
- Mapear errores backend al control correspondiente.
- Deshabilitar confirmación mientras una mutación está en progreso.
- Conservar borrador local solo cuando se defina explícitamente.

## Tablas y listados

- Paginación y filtrado preferentemente server-side.
- No asumir que una tabla cabe en móvil; elegir estrategia responsive explícita.
- No permitir scroll horizontal del body; si es imprescindible, contenerlo dentro de la tabla.
- No cargar catálogos completos si pueden crecer.
- Columnas esenciales visibles; detalles secundarios en panel o diálogo.
- Estados vacíos con acción siguiente.

## Modales y overlays

Usar `MatDialog` para acciones acotadas. No encerrar flujos largos en múltiples diálogos anidados. En móvil, convertir formularios largos en diálogo fullscreen o página. Usar `MatBottomSheet` para acciones contextuales cuando mejore la experiencia.

## Notificaciones

- Snackbar para confirmaciones no críticas.
- Alert/banner persistente para errores que bloquean el flujo.
- Confirmación explícita para cancelar, cerrar o revertir.

## Calidad

No se acepta código con:

- `console.log` residual;
- suscripciones sin cleanup;
- llamadas HTTP en componentes;
- textos críticos sin centralización mínima;
- rutas sin lazy loading injustificado;
- errores ignorados con `catchError(() => EMPTY)`.
