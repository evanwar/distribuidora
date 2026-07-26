# Products

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **4 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/products` | Bearer |
| `POST` | `/api/v1/products` | Bearer |
| `GET` | `/api/v1/products/{id}` | Bearer |
| `PUT` | `/api/v1/products/{id}` | Bearer |

---

## GET /api/v1/products

`GET /api/v1/products`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `Search` | query | string | No | `string` |
| `Page` | query | number | No | `1` |
| `PageSize` | query | number | No | `20` |

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

## POST /api/v1/products

`POST /api/v1/products`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [ProductRequest](./MODELS.md#product-request)

```json
{
  "sku": "SKU-001",
  "name": "Ejemplo",
  "description": "Descripción de ejemplo",
  "categoryId": "{{categoryId}}",
  "brandId": "{{brandId}}",
  "unitId": "{{unitId}}",
  "barcode": "7500000000001",
  "cost": 1,
  "basePrice": 1,
  "minimumStock": 1,
  "active": true
}
```

### Respuesta exitosa

- Estado: `201` Created
- Tipo: [ProductResponseApiResponse](./MODELS.md#product-response-api-response)

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

## GET /api/v1/products/{id}

`GET /api/v1/products/{id}`

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

## PUT /api/v1/products/{id}

`PUT /api/v1/products/{id}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [ProductRequest](./MODELS.md#product-request)

```json
{
  "sku": "SKU-001",
  "name": "Ejemplo",
  "description": "Descripción de ejemplo",
  "categoryId": "{{categoryId}}",
  "brandId": "{{brandId}}",
  "unitId": "{{unitId}}",
  "barcode": "7500000000001",
  "cost": 1,
  "basePrice": 1,
  "minimumStock": 1,
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
