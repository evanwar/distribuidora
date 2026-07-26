---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# 04 - Contrato de integración con backend

## Inventario ejecutable

La cobertura funcional exacta se controla en `06_MATRIZ_ENDPOINTS_FRONTEND.md`: 109 operaciones distribuidas entre F0 y F01-F09. Los contratos detallados de request, response, parámetros y errores están en `../Distribuidora/docs/frontend-api/`; la colección de apoyo está en `../Distribuidora/postman/Distribuidora.Api.postman_collection.json`.

Cada slice debe declarar los IDs de operación que integra. “Cliente generado compila” no equivale a endpoint integrado: se exige adapter, consumidor, estados y pruebas.

## Fuente de verdad

El archivo OpenAPI publicado por ASP.NET Core es el contrato ejecutable. Los documentos del paquete describen intención, pero no autorizan inventar una operación ausente.

## Flujo de sincronización

```text
backend compila
-> genera openapi.json
-> CI valida breaking changes
-> frontend regenera cliente
-> adapters compilan
-> tests de contrato pasan
```

## Cliente generado

- Generar cliente `typescript-angular` compatible con la versión fijada.
- Guardar código generado en una carpeta aislada.
- No editar archivos generados.
- No filtrar DTOs generados directamente a templates.
- Crear adapters y mappers para normalizar nombres, fechas y envelopes.

## Operaciones críticas esperadas

El frontend debe consumir las operaciones reales equivalentes a:

```text
auth/login, auth/refresh, auth/logout
users, roles, permissions
products, customers, suppliers
inventory/balances, inventory/kardex, inventory/low-stock
inventory/adjustments, inventory/transfers si están activos
purchases, goods-receipts
counter-sales, confirm, payments, cancel, summary, print
accounts-receivable, customer-payments, statements
reports/dashboard
settings
```

Las rutas exactas se toman de OpenAPI.

## Errores

### 400/422

Mapear validaciones por campo y mostrar error global cuando no exista campo.

### 401

Intentar renovación solo una vez según estrategia acordada; evitar bucles.

### 403

Mostrar acceso denegado y no reintentar automáticamente.

### 404

Mostrar recurso no encontrado y ofrecer volver al listado.

### 409

Tratar como conflicto de concurrencia o estado. Recargar datos y pedir al usuario revisar antes de repetir.

### 429

Respetar `Retry-After` si existe.

### 5xx

Mostrar mensaje seguro, conservar `correlationId` y permitir reintentar cuando la operación sea idempotente.

## Correlación

- Propagar o capturar `correlationId`.
- Mostrarlo en detalle de error copiable.
- No usarlo como mensaje principal para el usuario.

## Mutaciones críticas

Para confirmar venta, cancelar, ajustar inventario o registrar pago:

- prevenir doble click;
- usar idempotency key si el backend la expone;
- no reintentar automáticamente una mutación no idempotente;
- reconciliar el estado con la respuesta final del servidor.

## Gap report

Si falta contrato, el agente debe crear:

```md
### Gap de API
- Feature:
- Operación necesaria:
- Motivo:
- Request esperado:
- Response esperado:
- Permiso:
- Riesgo de inventar solución local:
```
