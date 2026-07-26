# CustomerPayments

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **4 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `POST` | `/api/v1/customer-payments` | Bearer |
| `POST` | `/api/v1/customer-payments/{id}/apply` | Bearer |
| `POST` | `/api/v1/customer-payments/{id}/cancel` | Bearer |
| `POST` | `/api/v1/customers/{customerId}/credit-limit` | Bearer |

---

## POST /api/v1/customer-payments

`POST /api/v1/customer-payments`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [CustomerPaymentRequest](./MODELS.md#customer-payment-request)

```json
{
  "customerId": "{{customerId}}",
  "method": "CASH",
  "amount": 1,
  "reference": "REF-0001"
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

## POST /api/v1/customer-payments/{id}/apply

`POST /api/v1/customer-payments/{id}/apply`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [ApplyPaymentRequest](./MODELS.md#apply-payment-request)

```json
{
  "allocations": [
    {
      "accountReceivableId": "{{accountReceivableId}}",
      "amount": 1
    }
  ]
}
```

### Respuesta exitosa

- Estado: `204` No Content

### Estados documentados

| Estado | Significado |
|---:|---|
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Client Error |
| 500 | Server Error |

---

## POST /api/v1/customer-payments/{id}/cancel

`POST /api/v1/customer-payments/{id}/cancel`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [CancelRequest](./MODELS.md#cancel-request)

```json
{
  "reason": "Motivo de ejemplo"
}
```

### Respuesta exitosa

- Estado: `204` No Content

### Estados documentados

| Estado | Significado |
|---:|---|
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Client Error |
| 500 | Server Error |

---

## POST /api/v1/customers/{customerId}/credit-limit

`POST /api/v1/customers/{customerId}/credit-limit`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `customerId` | path | string (UUID) | Sí | `{{customerId}}` |

### Body

Tipo: [ChangeCreditLimitRequest](./MODELS.md#change-credit-limit-request)

```json
{
  "newLimit": 1,
  "reason": "Motivo de ejemplo"
}
```

### Respuesta exitosa

- Estado: `204` No Content

### Estados documentados

| Estado | Significado |
|---:|---|
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Client Error |
| 500 | Server Error |

---
