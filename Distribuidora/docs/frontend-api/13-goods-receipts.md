# GoodsReceipts

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **4 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/goods-receipts/{id}` | Bearer |
| `POST` | `/api/v1/goods-receipts` | Bearer |
| `POST` | `/api/v1/goods-receipts/{id}/close` | Bearer |
| `POST` | `/api/v1/goods-receipts/{id}/cancel` | Bearer |

---

## GET /api/v1/goods-receipts/{id}

`GET /api/v1/goods-receipts/{id}`

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

## POST /api/v1/goods-receipts

`POST /api/v1/goods-receipts`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [CreateReceiptRequest](./MODELS.md#create-receipt-request)

```json
{
  "supplierId": "{{supplierId}}",
  "purchaseOrderId": "{{purchaseOrderId}}",
  "destinationWarehouseId": "{{destinationWarehouseId}}",
  "notes": "Nota de ejemplo",
  "items": [
    {
      "productId": "{{productId}}",
      "quantity": 1,
      "unitCost": 1
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

## POST /api/v1/goods-receipts/{id}/close

`POST /api/v1/goods-receipts/{id}/close`

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

## POST /api/v1/goods-receipts/{id}/cancel

`POST /api/v1/goods-receipts/{id}/cancel`

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
