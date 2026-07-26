# Policies

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **4 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/admin/policies/credit` | Bearer |
| `PUT` | `/api/v1/admin/policies/credit` | Bearer |
| `GET` | `/api/v1/admin/policies/inventory` | Bearer |
| `PUT` | `/api/v1/admin/policies/inventory` | Bearer |

---

## GET /api/v1/admin/policies/credit

`GET /api/v1/admin/policies/credit`

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

## PUT /api/v1/admin/policies/credit

`PUT /api/v1/admin/policies/credit`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [CreditPolicyRequest](./MODELS.md#credit-policy-request)

```json
{
  "allowCreditSales": true,
  "defaultDueDays": 1,
  "requireAuthorizationOverLimit": true,
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

## GET /api/v1/admin/policies/inventory

`GET /api/v1/admin/policies/inventory`

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

## PUT /api/v1/admin/policies/inventory

`PUT /api/v1/admin/policies/inventory`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [InventoryPolicyRequest](./MODELS.md#inventory-policy-request)

```json
{
  "allowNegativeStock": true,
  "requireReasonForAdjustment": true,
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
