# PaymentMethods

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **3 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/admin/payment-methods` | Bearer |
| `POST` | `/api/v1/admin/payment-methods` | Bearer |
| `PUT` | `/api/v1/admin/payment-methods/{id}` | Bearer |

---

## GET /api/v1/admin/payment-methods

`GET /api/v1/admin/payment-methods`

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

## POST /api/v1/admin/payment-methods

`POST /api/v1/admin/payment-methods`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [PaymentMethodRequest](./MODELS.md#payment-method-request)

```json
{
  "code": "CASH",
  "name": "Ejemplo",
  "requiresReference": true,
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

## PUT /api/v1/admin/payment-methods/{id}

`PUT /api/v1/admin/payment-methods/{id}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [PaymentMethodRequest](./MODELS.md#payment-method-request)

```json
{
  "code": "CASH",
  "name": "Ejemplo",
  "requiresReference": true,
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
