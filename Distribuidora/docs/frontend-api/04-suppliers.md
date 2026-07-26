# Suppliers

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **3 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/suppliers` | Bearer |
| `POST` | `/api/v1/suppliers` | Bearer |
| `PUT` | `/api/v1/suppliers/{id}` | Bearer |

---

## GET /api/v1/suppliers

`GET /api/v1/suppliers`

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

## POST /api/v1/suppliers

`POST /api/v1/suppliers`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [SupplierRequest](./MODELS.md#supplier-request)

```json
{
  "name": "Ejemplo",
  "contactName": "string",
  "phone": "5551234567",
  "email": "demo@example.com",
  "address": "Av. Principal 123",
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

## PUT /api/v1/suppliers/{id}

`PUT /api/v1/suppliers/{id}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [SupplierRequest](./MODELS.md#supplier-request)

```json
{
  "name": "Ejemplo",
  "contactName": "string",
  "phone": "5551234567",
  "email": "demo@example.com",
  "address": "Av. Principal 123",
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
