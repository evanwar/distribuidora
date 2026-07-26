# CancellationReasons

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **3 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/cancellation-reasons` | Bearer |
| `POST` | `/api/v1/cancellation-reasons` | Bearer |
| `PUT` | `/api/v1/cancellation-reasons/{id}` | Bearer |

---

## GET /api/v1/cancellation-reasons

`GET /api/v1/cancellation-reasons`

> Autenticación: `Authorization: Bearer <accessToken>`.

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

## POST /api/v1/cancellation-reasons

`POST /api/v1/cancellation-reasons`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [CancellationReasonRequest](./MODELS.md#cancellation-reason-request)

```json
{
  "code": "CASH",
  "description": "Descripción de ejemplo",
  "module": "string",
  "requiresAuthorization": true,
  "active": true
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

## PUT /api/v1/cancellation-reasons/{id}

`PUT /api/v1/cancellation-reasons/{id}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [CancellationReasonRequest](./MODELS.md#cancellation-reason-request)

```json
{
  "code": "CASH",
  "description": "Descripción de ejemplo",
  "module": "string",
  "requiresAuthorization": true,
  "active": true
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
