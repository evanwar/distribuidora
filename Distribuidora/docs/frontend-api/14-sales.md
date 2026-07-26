# Sales

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **9 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/counter-sales` | Bearer |
| `POST` | `/api/v1/counter-sales` | Bearer |
| `GET` | `/api/v1/counter-sales/{id}` | Bearer |
| `PUT` | `/api/v1/counter-sales/{id}` | Bearer |
| `POST` | `/api/v1/counter-sales/{id}/confirm` | Bearer |
| `POST` | `/api/v1/counter-sales/{id}/payments` | Bearer |
| `POST` | `/api/v1/counter-sales/{id}/cancel` | Bearer |
| `GET` | `/api/v1/counter-sales/{id}/summary` | Bearer |
| `GET` | `/api/v1/counter-sales/{id}/print` | Bearer |

---

## GET /api/v1/counter-sales

`GET /api/v1/counter-sales`

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

## POST /api/v1/counter-sales

`POST /api/v1/counter-sales`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [CreateSaleRequest](./MODELS.md#create-sale-request)

```json
{
  "customerId": "{{customerId}}",
  "sourceWarehouseId": "{{sourceWarehouseId}}",
  "paymentCondition": 0,
  "taxTotal": 1,
  "notes": "Nota de ejemplo",
  "items": [
    {
      "productId": "{{productId}}",
      "quantity": 1,
      "unitPrice": 1,
      "discount": 1
    }
  ],
  "payments": [
    {
      "method": "CASH",
      "amount": 1,
      "reference": "REF-0001"
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

## GET /api/v1/counter-sales/{id}

`GET /api/v1/counter-sales/{id}`

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

## PUT /api/v1/counter-sales/{id}

`PUT /api/v1/counter-sales/{id}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [CreateSaleRequest](./MODELS.md#create-sale-request)

```json
{
  "customerId": "{{customerId}}",
  "sourceWarehouseId": "{{sourceWarehouseId}}",
  "paymentCondition": 0,
  "taxTotal": 1,
  "notes": "Nota de ejemplo",
  "items": [
    {
      "productId": "{{productId}}",
      "quantity": 1,
      "unitPrice": 1,
      "discount": 1
    }
  ],
  "payments": [
    {
      "method": "CASH",
      "amount": 1,
      "reference": "REF-0001"
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

## POST /api/v1/counter-sales/{id}/confirm

`POST /api/v1/counter-sales/{id}/confirm`

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

## POST /api/v1/counter-sales/{id}/payments

`POST /api/v1/counter-sales/{id}/payments`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [SalePaymentRequest](./MODELS.md#sale-payment-request)

```json
{
  "method": "CASH",
  "amount": 1,
  "reference": "REF-0001"
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

## POST /api/v1/counter-sales/{id}/cancel

`POST /api/v1/counter-sales/{id}/cancel`

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

## GET /api/v1/counter-sales/{id}/summary

`GET /api/v1/counter-sales/{id}/summary`

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

## GET /api/v1/counter-sales/{id}/print

`GET /api/v1/counter-sales/{id}/print`

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
