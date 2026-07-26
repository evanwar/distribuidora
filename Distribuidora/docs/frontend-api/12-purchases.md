# Purchases

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **6 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/purchases` | Bearer |
| `POST` | `/api/v1/purchases` | Bearer |
| `GET` | `/api/v1/purchases/{id}` | Bearer |
| `PUT` | `/api/v1/purchases/{id}` | Bearer |
| `POST` | `/api/v1/purchases/{id}/confirm` | Bearer |
| `POST` | `/api/v1/purchases/{id}/cancel` | Bearer |

---

## GET /api/v1/purchases

`GET /api/v1/purchases`

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

## POST /api/v1/purchases

`POST /api/v1/purchases`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [CreatePurchaseRequest](./MODELS.md#create-purchase-request)

```json
{
  "supplierId": "{{supplierId}}",
  "tax": 1,
  "notes": "Nota de ejemplo",
  "items": [
    {
      "productId": "{{productId}}",
      "quantity": 1,
      "unitCost": 1,
      "discount": 1
    }
  ]
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

## GET /api/v1/purchases/{id}

`GET /api/v1/purchases/{id}`

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

## PUT /api/v1/purchases/{id}

`PUT /api/v1/purchases/{id}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [CreatePurchaseRequest](./MODELS.md#create-purchase-request)

```json
{
  "supplierId": "{{supplierId}}",
  "tax": 1,
  "notes": "Nota de ejemplo",
  "items": [
    {
      "productId": "{{productId}}",
      "quantity": 1,
      "unitCost": 1,
      "discount": 1
    }
  ]
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

## POST /api/v1/purchases/{id}/confirm

`POST /api/v1/purchases/{id}/confirm`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Respuesta exitosa

- Estado: `204` No Content

### Estados documentados

| Estado | Significado |
|---:|---|
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Client Error |
| 500 | Server Error |

---

## POST /api/v1/purchases/{id}/cancel

`POST /api/v1/purchases/{id}/cancel`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [CancelRequest](./MODELS.md#cancel-request)

```json
{
  "reason": "Motivo de ejemplo"
}
```

### Respuesta exitosa

- Estado: `204` No Content

### Estados documentados

| Estado | Significado |
|---:|---|
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Client Error |
| 500 | Server Error |

---
