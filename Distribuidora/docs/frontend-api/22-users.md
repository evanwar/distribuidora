# Users

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **4 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/users` | Bearer |
| `POST` | `/api/v1/users` | Bearer |
| `PUT` | `/api/v1/users/{id}` | Bearer |
| `PUT` | `/api/v1/users/{id}/roles` | Bearer |

---

## GET /api/v1/users

`GET /api/v1/users`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Respuesta exitosa

- Estado: `200` Success
- Tipo: [UserResponseIReadOnlyCollectionApiResponse](./MODELS.md#user-response-iread-only-collection-api-response)

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

## POST /api/v1/users

`POST /api/v1/users`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [CreateUserRequest](./MODELS.md#create-user-request)

```json
{
  "name": "Ejemplo",
  "username": "usuario.demo",
  "email": "demo@example.com",
  "password": "********",
  "roleIds": [
    "{{roleIds}}"
  ]
}
```

### Respuesta exitosa

- Estado: `201` Created
- Tipo: [UserResponseApiResponse](./MODELS.md#user-response-api-response)

### Estados documentados

| Estado | Significado |
|---:|---|
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Client Error |
| 500 | Server Error |

---

## PUT /api/v1/users/{id}

`PUT /api/v1/users/{id}`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [UpdateUserRequest](./MODELS.md#update-user-request)

```json
{
  "name": "Ejemplo",
  "email": "demo@example.com",
  "active": true
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

## PUT /api/v1/users/{id}/roles

`PUT /api/v1/users/{id}/roles`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [AssignIdsRequest](./MODELS.md#assign-ids-request)

```json
{
  "ids": [
    "{{ids}}"
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
