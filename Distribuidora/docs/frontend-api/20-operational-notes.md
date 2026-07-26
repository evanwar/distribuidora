# OperationalNotes

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **1 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `POST` | `/api/v1/operational-notes` | Bearer |

---

## POST /api/v1/operational-notes

`POST /api/v1/operational-notes`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [OperationalNoteRequest](./MODELS.md#operational-note-request)

```json
{
  "entityName": "string",
  "entityId": "{{entityId}}",
  "note": "Nota de ejemplo"
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
