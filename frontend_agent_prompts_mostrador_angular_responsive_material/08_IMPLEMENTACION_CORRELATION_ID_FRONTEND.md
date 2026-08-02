---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Signals, RxJS, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend observability, CorrelationId and OperationId propagation
backend_contract: X-Correlation-ID, X-Operation-ID and ApiResponse.correlationId
---

# 08 - Implementación de CorrelationId y trazabilidad desde frontend

## Rol del agente

Actúa como agente senior Angular responsable de observabilidad transversal. Implementa la propagación de identificadores sin introducir reglas de negocio en interceptores, sin editar el cliente OpenAPI generado y sin registrar credenciales, tokens, cuerpos completos ni datos personales.

Antes de modificar código, lee:

```text
00_ORQUESTADOR.md
02_ARQUITECTURA_GLOBAL.md
04_CONTRATO_INTEGRACION_BACKEND.md
06_MATRIZ_ENDPOINTS_FRONTEND.md
skills/skill_01_angular_architecture.md
skills/skill_05_openapi_backend_contracts.md
skills/skill_06_auth_security_permissions.md
skills/skill_08_testing_quality.md
skills/skill_10_error_handling_observability.md
```

## Problema confirmado

El backend ya soporta `X-Correlation-ID`, `X-Operation-ID`, `ApiResponse.correlationId` y consultas por correlación u operación. El frontend conserva el `correlationId` de algunos errores, pero no agrega ambos headers a sus solicitudes.

Como resultado:

- cada request recibe identificadores generados por el backend;
- varias llamadas del mismo flujo no comparten `OperationId`;
- crear, editar, confirmar y pagar no puede reconstruirse como una sola operación iniciada en el navegador;
- no existe un contrato explícito para conservar los IDs durante un retry por `401`;
- las respuestas exitosas críticas pueden perder su referencia al mapear solamente `data`.

## Objetivo observable

1. Cada request al API llevará un `X-Correlation-ID` único.
2. Cada flujo lógico podrá compartir un `X-Operation-ID` entre múltiples requests.
3. Un retry técnico conservará los IDs de la solicitud original.
4. El frontend conservará el identificador confirmado por el servidor.
5. Los errores mostrarán una referencia copiable sin exponer información sensible.
6. Las mutaciones críticas devolverán al store el resultado y su trazabilidad.
7. Soporte podrá consultar TRC-01 y TRC-02 desde la referencia visible.

## Semántica obligatoria

| Identificador | Ciclo de vida | Regla |
|---|---|---|
| `CorrelationId` | Una solicitud lógica, incluyendo retry técnico | Nuevo por cada acción HTTP iniciada por la aplicación. |
| `OperationId` | Un flujo compuesto por una o más solicitudes | Se reutiliza mientras el usuario trabaja en la misma operación. |
| `TraceId` | Infraestructura distribuida del backend | No generarlo manualmente en Angular. |
| `TransactionId` | Transacción PostgreSQL | Responsabilidad del backend. |
| `EventId` / `CausationId` | Eventos y outbox | Responsabilidad del backend. |

Ejemplo:

```text
Flujo: venta de mostrador
OperationId: POS-0c44d607-7bd8-4f81-9e5e-5667ca3bf89e

POST /counter-sales                CorrelationId: WEB-a1...
PUT /counter-sales/{id}            CorrelationId: WEB-b2...
POST /counter-sales/{id}/confirm   CorrelationId: WEB-c3...
POST /counter-sales/{id}/payments  CorrelationId: WEB-d4...
```

Las correlaciones son distintas y la operación es compartida.

## Reglas no negociables

1. El código y los nombres técnicos se escriben en inglés.
2. No editar `src/app/core/api/generated`.
3. No agregar headers a assets, URLs de terceros o solicitudes ajenas al API.
4. Los IDs solo admiten letras, números, guion, guion bajo o punto y máximo 100 caracteres.
5. No incluir usuario, correo, folio, ruta, token o datos del documento en el ID.
6. No registrar credenciales, tokens, cookies o cuerpos completos.
7. No reintentar automáticamente mutaciones no idempotentes.
8. No usar un singleton mutable como única fuente de `OperationId` para flujos concurrentes.
9. El `OperationId` explícito debe viajar por `HttpContext`; el fallback puede generarse por request.
10. Si el backend reemplaza un ID, el valor devuelto por servidor es autoritativo.

## Arquitectura objetivo

```text
src/app/core/observability/
  observability.constants.ts
  observability-context.ts
  trace-id.factory.ts
  operation-context.service.ts
  correlation.interceptor.ts
  response-trace.service.ts
  trace.models.ts
  correlation.interceptor.spec.ts
  operation-context.service.spec.ts

src/app/core/error-handling/
  api-error.interceptor.ts
  api-error.model.ts

src/app/shared/ui/trace-reference/
  trace-reference.component.ts
  trace-reference.component.spec.ts
```

Los adapters pueden usar `HttpContext`; los componentes presentacionales no deben conocer headers ni DTOs generados.

## Slice OBS-01 - Contratos e IDs

Crear:

```ts
export const CORRELATION_HEADER = 'X-Correlation-ID';
export const OPERATION_HEADER = 'X-Operation-ID';

export const OPERATION_ID = new HttpContextToken<string | null>(() => null);

export interface ResponseTrace {
  readonly correlationId: string;
  readonly operationId?: string;
}

export interface TracedResult<T> {
  readonly data: T;
  readonly message?: string;
  readonly trace: ResponseTrace;
}
```

`TraceIdFactory` debe usar `globalThis.crypto.randomUUID()` y generar valores aceptados por el backend:

```text
CorrelationId: WEB-{uuid}
OperationId: POS-{uuid}, INV-{uuid}, PUR-{uuid}, AR-{uuid}, ADM-{uuid}
```

Debe incluir un fallback testeable para navegadores sin `randomUUID`, sin depender únicamente de la fecha.

### Criterios de aceptación

- IDs válidos y únicos.
- Longitud menor o igual a 100.
- Prefijos semánticos sin información sensible.
- Factory inyectable y sustituible en pruebas.

## Slice OBS-02 - Interceptor de correlación

Crear `correlationInterceptor: HttpInterceptorFn` que:

1. ignore URLs fuera del API;
2. conserve headers válidos ya presentes;
3. genere un `CorrelationId` cuando no exista;
4. use `OPERATION_ID` desde `HttpContext` cuando esté definido;
5. genere un `OperationId` de fallback para solicitudes aisladas;
6. clone el request una sola vez con ambos headers;
7. capture headers de respuesta cuando estén expuestos;
8. no transforme errores ni decida mensajes de UX.

### Orden obligatorio

```ts
provideHttpClient(
  withInterceptors([
    correlationInterceptor,
    authInterceptor,
    apiErrorInterceptor,
  ]),
);
```

Correlación debe ejecutarse antes de autenticación. Cuando `authInterceptor` repita el request después de renovar el token, reenviará el request ya decorado y conservará ambos IDs.

La decisión de “es API” debe centralizarse y usar la URL configurada. No comparar cualquier URL que contenga el texto `api`.

### CORS

Para leer headers cross-origin, el backend debe exponer:

```http
Access-Control-Expose-Headers: X-Correlation-ID, X-Operation-ID
```

Si no están expuestos, usar `ApiResponse.correlationId` como fuente principal y documentar el gap de `OperationId`.

## Slice OBS-03 - Contexto de operación

Crear `OperationContextService` sin depender de estado global ambiguo:

```ts
export interface OperationContext {
  readonly id: string;
  readonly kind: 'pos' | 'inventory' | 'purchase' | 'receivable' | 'administration';
  readonly startedAt: number;
}

start(kind: OperationContext['kind']): OperationContext;
toHttpContext(operation: OperationContext, base?: HttpContext): HttpContext;
restore(key: string): OperationContext | null;
remember(key: string, operation: OperationContext): void;
complete(key: string): void;
```

### Persistencia

- Mantener operaciones normales en memoria.
- Usar `sessionStorage` solo para flujos recuperables que deban sobrevivir a F5.
- Aplicar TTL máximo de 8 horas.
- Guardar únicamente `id`, `kind` y `startedAt`.
- No usar `localStorage` para operaciones activas.
- Eliminar al completar, cancelar definitivamente o expirar.

### Cliente OpenAPI

Los métodos generados aceptan `HttpContext`. El adapter debe pasarlo sin editar generated:

```ts
const context = operationContext.toHttpContext(operation);
return generatedService.someOperation(params, context);
```

Si un adapter combina varias llamadas, recibe `OperationContext` explícitamente.

## Slice OBS-04 - Errores y respuestas exitosas

Extender `ApiError` con `operationId?: string`.

Prioridad de `CorrelationId`:

1. `error.error.correlationId` del envelope.
2. Header `X-Correlation-ID` de respuesta.
3. Header enviado en el request.

Prioridad de `OperationId`:

1. Header `X-Operation-ID` de respuesta.
2. Header enviado en el request.

El interceptor normaliza; el store o page decide el mensaje y recuperación.

Los adapters de mutaciones de ventas, inventario, compras, cobranza y administración no deben descartar trazabilidad. Deben mapear el envelope a `TracedResult<T>` o view model equivalente. Priorizar operaciones que mueven dinero, inventario o estado documental.

## Slice OBS-05 - Integración por flujo

### F05 Punto de venta

Compartir una operación para:

```text
crear borrador
actualizar borrador
confirmar
registrar pago relacionado
obtener resumen o comprobante inmediato
```

Restaurar la operación del borrador después de F5 cuando siga vigente. Completarla después de confirmación/cobro definitivo o cancelación autoritativa.

### F03 Inventario

Separar operaciones para crear/confirmar ajuste, crear/cancelar ajuste y transferencia. Consultas de existencia y kardex pueden usar operación aislada.

### F04 Compras

Compartir operación para edición/confirmación de orden y para registro/cierre de recepción cuando correspondan al mismo flujo visible.

### F06 Cobranza

Compartir operación entre registro, aplicación y consulta final del pago cuando formen una sola acción del usuario.

Dos pestañas, ventas o formularios simultáneos deben tener operaciones diferentes. El store de cada feature es dueño de su contexto.

## Slice OBS-06 - UX de referencia y trazabilidad

Crear `TraceReferenceComponent` configurable:

```ts
correlationId = input.required<string>();
operationId = input<string>();
compact = input(false);
copied = output<string>();
openTrace = output<void>();
```

Debe:

- mostrar `Referencia: {correlationId}`;
- copiar con botón accesible;
- anunciar la copia mediante `aria-live`;
- no mostrar stack trace ni detalles técnicos;
- mostrar “Abrir trazabilidad” solo con `logs.trace.read`;
- reutilizarse desde `UiAlertComponent`.

Integrar:

```text
TRC-01 GET /api/v1/trace/operations/{operationId}
TRC-02 GET /api/v1/trace/correlations/{correlationId}
```

La vista debe ordenar por fecha y distinguir `UserActivity`, `Audit`, `SystemError`, `SystemEvent` e `InventoryMovement`.

## Pruebas obligatorias

### Unitarias

- Factory genera IDs válidos y únicos.
- Request API recibe ambos headers.
- Request externo no recibe headers.
- Header explícito válido se conserva.
- `HttpContext` reutiliza `OperationId`.
- Requests simultáneos no comparten operación accidentalmente.
- Retry por `401` conserva IDs.
- Error prioriza el ID del servidor.
- Fallback usa headers de respuesta o request.
- Operación persistida expira y se limpia.
- Ningún registro contiene `Authorization`, password o refresh token.

### Componentes

- Referencia visible y copiable.
- Soporte de teclado y anuncio accesible.
- Acción de trazabilidad oculta sin permiso.

### E2E Playwright

1. Cada request tiene `X-Correlation-ID`.
2. Crear/actualizar/confirmar venta comparte `X-Operation-ID`.
3. Sus correlaciones son diferentes.
4. F5 recupera la operación activa cuando aplica.
5. Dos ventas paralelas usan operaciones distintas.
6. Un error muestra la referencia devuelta por API.
7. TRC-02 usa la misma referencia.

No depender de valores aleatorios exactos; validar formato y relaciones.

## Observabilidad segura

Se permite registrar en desarrollo: método, ruta normalizada, status, duración, `CorrelationId` y `OperationId`.

Está prohibido registrar:

```text
Authorization
accessToken
refreshToken
password
cookies
body completo
datos fiscales o personales
parámetros libres con PII
```

No enviar telemetría a terceros sin ADR, consentimiento de despliegue y política de retención.

## Archivos existentes que deben modificarse

```text
src/app/app.config.ts
src/app/core/error-handling/api-error.interceptor.ts
src/app/core/error-handling/api-error.model.ts
src/app/shared/ui/alert/ui-alert.component.ts
adapters/stores de F03, F04, F05 y F06
```

No modificar `src/app/core/api/generated/**`.

## Definition of Done

- [ ] Requests al API envían headers válidos.
- [ ] URLs externas y assets no reciben headers.
- [ ] Retry de autenticación conserva la correlación.
- [ ] Flujos críticos comparten `OperationId`.
- [ ] Operaciones concurrentes permanecen aisladas.
- [ ] Errores y mutaciones conservan la referencia del servidor.
- [ ] La referencia es copiable y accesible.
- [ ] TRC-01 y TRC-02 tienen adapter, consumidor y prueba.
- [ ] No se editaron archivos generated.
- [ ] No se registran secretos ni PII.
- [ ] `npm run lint` pasa.
- [ ] `npm test -- --watch=false` pasa.
- [ ] `npm run build` pasa.
- [ ] Playwright cubre ventas y al menos un flujo de inventario.
- [ ] Se documentó cualquier gap CORS/OpenAPI.

## Contrato de salida del agente

```md
## Resumen
Qué se implementó y qué flujos quedaron correlacionados.

## Archivos creados/modificados
Agrupados por core, shared y feature.

## Propagación
Orden de interceptores, formato de IDs y política de operación.

## Flujos integrados
Requests que comparten OperationId y condición de cierre.

## Seguridad
Evidencia de que no se almacenan ni registran secretos o PII.

## Pruebas
Unitarias, componentes y E2E ejecutadas.

## Evidencia de calidad
Resultado de lint, test, build y Playwright.

## Riesgos / pendientes
CORS, OpenAPI, headers no expuestos o flujos aún no integrados.
```

## Prompt maestro de ejecución

```text
Eres un agente senior Angular responsable de implementar observabilidad frontend para Distribuidora. Lee el orquestador frontend, este documento y las skills obligatorias. Implementa CorrelationId único por request y OperationId explícito por flujo mediante HttpContext. Registra correlationInterceptor antes de authInterceptor para conservar IDs durante retries por 401. No edites el cliente OpenAPI generado, no registres bodies, PII, credenciales o tokens y no introduzcas lógica de negocio en interceptores. Integra primero F05, después F03, F04 y F06. Conserva la referencia autoritativa del backend en errores y mutaciones críticas, agrega UX copiable e integra TRC-01/TRC-02. Entrega pruebas unitarias, componentes, Playwright y evidencia de lint/test/build.
```
