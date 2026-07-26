# Settings

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **2 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/admin/settings` | Bearer |
| `PUT` | `/api/v1/admin/settings/{key}` | Bearer |

---

## GET /api/v1/admin/settings

`GET /api/v1/admin/settings`

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

## PUT /api/v1/admin/settings/{key}

`PUT /api/v1/admin/settings/{key}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `key` | path | string | Sí | `string` |

### Body

Tipo: [UpdateSettingRequest](./MODELS.md#update-setting-request)

```json
{
  "value": "string",
  "dataType": "string",
  "description": "Descripción de ejemplo",
  "module": "string"
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
