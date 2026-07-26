# Auth

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **3 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `POST` | `/api/v1/auth/login` | No |
| `POST` | `/api/v1/auth/refresh` | No |
| `POST` | `/api/v1/auth/logout` | Bearer |

---

## POST /api/v1/auth/login

`POST /api/v1/auth/login`

> Autenticación: no requerida.

### Body

Tipo: [LoginRequest](./MODELS.md#login-request)

```json
{
  "username": "admin",
  "password": "********"
}
```

### Respuesta exitosa

- Estado: `200` Success
- Tipo: [AuthResponseApiResponse](./MODELS.md#auth-response-api-response)

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

## POST /api/v1/auth/refresh

`POST /api/v1/auth/refresh`

> Autenticación: no requerida.

### Body

Tipo: [RefreshRequest](./MODELS.md#refresh-request)

```json
{
  "refreshToken": "{{refreshToken}}"
}
```

### Respuesta exitosa

- Estado: `200` Success
- Tipo: [AuthResponseApiResponse](./MODELS.md#auth-response-api-response)

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

## POST /api/v1/auth/logout

`POST /api/v1/auth/logout`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [RefreshRequest](./MODELS.md#refresh-request)

```json
{
  "refreshToken": "{{refreshToken}}"
}
```

### Respuesta exitosa

- Estado: `200` Success
- Tipo: [OperationResponseApiResponse](./MODELS.md#operation-response-api-response)

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
