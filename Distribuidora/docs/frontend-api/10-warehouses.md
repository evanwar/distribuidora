# Warehouses

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **3 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/warehouses` | Bearer |
| `POST` | `/api/v1/warehouses` | Bearer |
| `PUT` | `/api/v1/warehouses/{id}` | Bearer |

---

## GET /api/v1/warehouses

`GET /api/v1/warehouses`

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

## POST /api/v1/warehouses

`POST /api/v1/warehouses`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [WarehouseRequest](./MODELS.md#warehouse-request)

```json
{
  "name": "Ejemplo",
  "type": 0,
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

## PUT /api/v1/warehouses/{id}

`PUT /api/v1/warehouses/{id}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [WarehouseRequest](./MODELS.md#warehouse-request)

```json
{
  "name": "Ejemplo",
  "type": 0,
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
