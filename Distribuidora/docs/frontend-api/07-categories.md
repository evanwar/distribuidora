# Categories

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **3 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/categories` | Bearer |
| `POST` | `/api/v1/categories` | Bearer |
| `PUT` | `/api/v1/categories/{id}` | Bearer |

---

## GET /api/v1/categories

`GET /api/v1/categories`

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

## POST /api/v1/categories

`POST /api/v1/categories`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [NamedCatalogRequest](./MODELS.md#named-catalog-request)

```json
{
  "name": "Ejemplo",
  "description": "Descripción de ejemplo",
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

## PUT /api/v1/categories/{id}

`PUT /api/v1/categories/{id}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [NamedCatalogRequest](./MODELS.md#named-catalog-request)

```json
{
  "name": "Ejemplo",
  "description": "Descripción de ejemplo",
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
