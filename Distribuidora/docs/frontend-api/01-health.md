# Health

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **1 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/health` | No |

---

## GET /api/v1/health

`GET /api/v1/health`

> Autenticación: no requerida.

### Respuesta exitosa

- Estado: `200` Success
- Tipo: [HealthResponseApiResponse](./MODELS.md#health-response-api-response)

### Estados documentados

| Estado | Significado |
|---:|---|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Client Error |
| 500 | Server Error |

---
