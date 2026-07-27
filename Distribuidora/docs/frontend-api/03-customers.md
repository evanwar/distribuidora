# Customers

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **3 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/customers` | Bearer |
| `POST` | `/api/v1/customers` | Bearer |
| `PUT` | `/api/v1/customers/{id}` | Bearer |

---

## GET /api/v1/customers

`GET /api/v1/customers`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Descripción |
|---|---|---|---:|---|
| `search` | query | string | No | Filtra por nombre o número celular. Ignora espacios, guiones y paréntesis del teléfono. |
| `limit` | query | integer | No | Limita la respuesta entre 1 y 50 clientes. |

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

## POST /api/v1/customers

`POST /api/v1/customers`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [CustomerRequest](./MODELS.md#customer-request)

```json
{
  "name": "Ejemplo",
  "taxId": "XAXX010101000",
  "phone": "5551234567",
  "email": "demo@example.com",
  "address": "Av. Principal 123",
  "city": "Ciudad de México",
  "creditLimit": 1,
  "creditBlocked": true,
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

## PUT /api/v1/customers/{id}

`PUT /api/v1/customers/{id}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [CustomerRequest](./MODELS.md#customer-request)

```json
{
  "name": "Ejemplo",
  "taxId": "XAXX010101000",
  "phone": "5551234567",
  "email": "demo@example.com",
  "address": "Av. Principal 123",
  "city": "Ciudad de México",
  "creditLimit": 1,
  "creditBlocked": true,
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
