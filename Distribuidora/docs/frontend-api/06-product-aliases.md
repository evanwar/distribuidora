# ProductAliases

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **3 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/product-aliases` | Bearer |
| `POST` | `/api/v1/product-aliases` | Bearer |
| `PUT` | `/api/v1/product-aliases/{id}` | Bearer |

---

## GET /api/v1/product-aliases

`GET /api/v1/product-aliases`

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

## POST /api/v1/product-aliases

`POST /api/v1/product-aliases`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [ProductAliasRequest](./MODELS.md#product-alias-request)

```json
{
  "productId": "{{productId}}",
  "alias": "string",
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

## PUT /api/v1/product-aliases/{id}

`PUT /api/v1/product-aliases/{id}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [ProductAliasRequest](./MODELS.md#product-alias-request)

```json
{
  "productId": "{{productId}}",
  "alias": "string",
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
