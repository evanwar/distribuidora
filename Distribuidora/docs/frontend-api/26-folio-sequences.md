# FolioSequences

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **3 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/admin/folio-sequences` | Bearer |
| `POST` | `/api/v1/admin/folio-sequences` | Bearer |
| `PUT` | `/api/v1/admin/folio-sequences/{id}` | Bearer |

---

## GET /api/v1/admin/folio-sequences

`GET /api/v1/admin/folio-sequences`

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

## POST /api/v1/admin/folio-sequences

`POST /api/v1/admin/folio-sequences`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [FolioSequenceRequest](./MODELS.md#folio-sequence-request)

```json
{
  "documentType": "SALE",
  "prefix": "F",
  "currentNumber": 1,
  "padding": 1,
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

## PUT /api/v1/admin/folio-sequences/{id}

`PUT /api/v1/admin/folio-sequences/{id}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [FolioSequenceRequest](./MODELS.md#folio-sequence-request)

```json
{
  "documentType": "SALE",
  "prefix": "F",
  "currentNumber": 1,
  "padding": 1,
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
