# Logs

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **8 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/logs/activity/{id}` | Bearer |
| `GET` | `/api/v1/logs/activity` | Bearer |
| `GET` | `/api/v1/logs/errors` | Bearer |
| `GET` | `/api/v1/logs/errors/{id}` | Bearer |
| `POST` | `/api/v1/logs/errors/{id}/resolve` | Bearer |
| `POST` | `/api/v1/logs/errors/{id}/reopen` | Bearer |
| `GET` | `/api/v1/logs/events` | Bearer |
| `GET` | `/api/v1/logs/events/{eventId}` | Bearer |

---

## GET /api/v1/logs/activity/{id}

`GET /api/v1/logs/activity/{id}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Estados documentados

| Estado | Significado |
|---:|---|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Client Error |
| 500 | Server Error |

---

## GET /api/v1/logs/activity

`GET /api/v1/logs/activity`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `dateFrom` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |
| `dateTo` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |
| `userId` | query | string (UUID) | No | `{{userId}}` |
| `module` | query | string | No | `string` |
| `action` | query | string | No | `string` |
| `succeeded` | query | boolean | No | `true` |
| `statusCode` | query | number | No | `1` |
| `correlationId` | query | string | No | `string` |
| `operationId` | query | string | No | `string` |
| `referenceFolio` | query | string | No | `REF-0001` |
| `page` | query | number | No | `1` |
| `pageSize` | query | number | No | `20` |

### Estados documentados

| Estado | Significado |
|---:|---|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Client Error |
| 500 | Server Error |

---

## GET /api/v1/logs/errors

`GET /api/v1/logs/errors`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `dateFrom` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |
| `dateTo` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |
| `severity` | query | string | No | `string` |
| `isResolved` | query | boolean | No | `true` |
| `fingerprint` | query | string | No | `string` |
| `correlationId` | query | string | No | `string` |
| `operationId` | query | string | No | `string` |
| `eventId` | query | string | No | `string` |
| `page` | query | number | No | `1` |
| `pageSize` | query | number | No | `20` |

### Estados documentados

| Estado | Significado |
|---:|---|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Client Error |
| 500 | Server Error |

---

## GET /api/v1/logs/errors/{id}

`GET /api/v1/logs/errors/{id}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Estados documentados

| Estado | Significado |
|---:|---|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Client Error |
| 500 | Server Error |

---

## POST /api/v1/logs/errors/{id}/resolve

`POST /api/v1/logs/errors/{id}/resolve`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [ErrorResolutionRequest](./MODELS.md#error-resolution-request)

```json
{
  "notes": "Nota de ejemplo"
}
```

### Estados documentados

| Estado | Significado |
|---:|---|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Client Error |
| 500 | Server Error |

---

## POST /api/v1/logs/errors/{id}/reopen

`POST /api/v1/logs/errors/{id}/reopen`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Estados documentados

| Estado | Significado |
|---:|---|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Client Error |
| 500 | Server Error |

---

## GET /api/v1/logs/events

`GET /api/v1/logs/events`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `dateFrom` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |
| `dateTo` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |
| `eventName` | query | string | No | `string` |
| `status` | query | string | No | `string` |
| `operationId` | query | string | No | `string` |
| `correlationId` | query | string | No | `string` |
| `causationId` | query | string | No | `string` |
| `page` | query | number | No | `1` |
| `pageSize` | query | number | No | `20` |

### Estados documentados

| Estado | Significado |
|---:|---|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Client Error |
| 500 | Server Error |

---

## GET /api/v1/logs/events/{eventId}

`GET /api/v1/logs/events/{eventId}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `eventId` | path | string | Sí | `string` |

### Estados documentados

| Estado | Significado |
|---:|---|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Client Error |
| 500 | Server Error |

---
