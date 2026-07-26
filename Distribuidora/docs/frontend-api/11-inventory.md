# Inventory

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **7 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/inventory/balances` | Bearer |
| `GET` | `/api/v1/inventory/kardex` | Bearer |
| `GET` | `/api/v1/inventory/low-stock` | Bearer |
| `POST` | `/api/v1/inventory/adjustments` | Bearer |
| `POST` | `/api/v1/inventory/adjustments/{id}/confirm` | Bearer |
| `POST` | `/api/v1/inventory/adjustments/{id}/cancel` | Bearer |
| `POST` | `/api/v1/inventory/transfers` | Bearer |

---

## GET /api/v1/inventory/balances

`GET /api/v1/inventory/balances`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `WarehouseId` | query | string (UUID) | No | `{{WarehouseId}}` |
| `ProductId` | query | string (UUID) | No | `{{ProductId}}` |

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

## GET /api/v1/inventory/kardex

`GET /api/v1/inventory/kardex`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `ProductId` | query | string (UUID) | No | `{{ProductId}}` |
| `WarehouseId` | query | string (UUID) | No | `{{WarehouseId}}` |
| `From` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |
| `To` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |

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

## GET /api/v1/inventory/low-stock

`GET /api/v1/inventory/low-stock`

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

## POST /api/v1/inventory/adjustments

`POST /api/v1/inventory/adjustments`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [CreateAdjustmentRequest](./MODELS.md#create-adjustment-request)

```json
{
  "warehouseId": "{{warehouseId}}",
  "reason": "Motivo de ejemplo",
  "items": [
    {
      "productId": "{{productId}}",
      "physicalQuantity": 1,
      "unitCost": 1
    }
  ]
}
```

### Respuesta exitosa

- Estado: `201` Created
- Tipo: [InventoryAdjustmentResponseApiResponse](./MODELS.md#inventory-adjustment-response-api-response)

### Estados documentados

| Estado | Significado |
|---:|---|
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Client Error |
| 500 | Server Error |

---

## POST /api/v1/inventory/adjustments/{id}/confirm

`POST /api/v1/inventory/adjustments/{id}/confirm`

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

## POST /api/v1/inventory/adjustments/{id}/cancel

`POST /api/v1/inventory/adjustments/{id}/cancel`

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

## POST /api/v1/inventory/transfers

`POST /api/v1/inventory/transfers`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [TransferRequest](./MODELS.md#transfer-request)

```json
{
  "productId": "{{productId}}",
  "sourceWarehouseId": "{{sourceWarehouseId}}",
  "destinationWarehouseId": "{{destinationWarehouseId}}",
  "quantity": 1,
  "unitCost": 1,
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
