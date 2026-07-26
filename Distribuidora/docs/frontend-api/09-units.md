# Units

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **3 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/units` | Bearer |
| `POST` | `/api/v1/units` | Bearer |
| `PUT` | `/api/v1/units/{id}` | Bearer |

---

## GET /api/v1/units

`GET /api/v1/units`

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

## POST /api/v1/units

`POST /api/v1/units`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [UnitRequest](./MODELS.md#unit-request)

```json
{
  "name": "Ejemplo",
  "abbreviation": "PZA",
  "allowsDecimals": true,
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

## PUT /api/v1/units/{id}

`PUT /api/v1/units/{id}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [UnitRequest](./MODELS.md#unit-request)

```json
{
  "name": "Ejemplo",
  "abbreviation": "PZA",
  "allowsDecimals": true,
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
