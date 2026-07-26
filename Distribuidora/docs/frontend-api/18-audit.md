# Audit

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **3 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/logs/audit` | Bearer |
| `GET` | `/api/v1/logs/audit/{id}` | Bearer |
| `GET` | `/api/v1/logs/audit/entities/{entityName}/{entityId}` | Bearer |

---

## GET /api/v1/logs/audit

`GET /api/v1/logs/audit`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `From` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |
| `To` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |
| `Module` | query | string | No | `string` |
| `UserId` | query | string (UUID) | No | `{{UserId}}` |
| `Action` | query | string | No | `string` |
| `EntityName` | query | string | No | `string` |
| `EntityId` | query | string (UUID) | No | `{{EntityId}}` |
| `OperationId` | query | string | No | `string` |
| `TransactionId` | query | string | No | `string` |
| `CorrelationId` | query | string | No | `string` |
| `ReferenceFolio` | query | string | No | `REF-0001` |
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

## GET /api/v1/logs/audit/{id}

`GET /api/v1/logs/audit/{id}`

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

## GET /api/v1/logs/audit/entities/{entityName}/{entityId}

`GET /api/v1/logs/audit/entities/{entityName}/{entityId}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `entityName` | path | string | Sí | `string` |
| `entityId` | path | string (UUID) | Sí | `{{entityId}}` |

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
