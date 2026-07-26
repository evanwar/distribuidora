# Reports

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **7 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/reports/sales-summary` | Bearer |
| `GET` | `/api/v1/reports/sales-by-product` | Bearer |
| `GET` | `/api/v1/reports/gross-profit` | Bearer |
| `GET` | `/api/v1/reports/inventory-summary` | Bearer |
| `GET` | `/api/v1/reports/low-stock` | Bearer |
| `GET` | `/api/v1/reports/purchases-summary` | Bearer |
| `GET` | `/api/v1/reports/accounts-receivable-aging` | Bearer |

---

## GET /api/v1/reports/sales-summary

`GET /api/v1/reports/sales-summary`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `From` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |
| `To` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |

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

## GET /api/v1/reports/sales-by-product

`GET /api/v1/reports/sales-by-product`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `From` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |
| `To` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |

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

## GET /api/v1/reports/gross-profit

`GET /api/v1/reports/gross-profit`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `From` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |
| `To` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |

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

## GET /api/v1/reports/inventory-summary

`GET /api/v1/reports/inventory-summary`

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

## GET /api/v1/reports/low-stock

`GET /api/v1/reports/low-stock`

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

## GET /api/v1/reports/purchases-summary

`GET /api/v1/reports/purchases-summary`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `From` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |
| `To` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |

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

## GET /api/v1/reports/accounts-receivable-aging

`GET /api/v1/reports/accounts-receivable-aging`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `asOf` | query | string (ISO 8601) | No | `2026-01-01T12:00:00Z` |

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
