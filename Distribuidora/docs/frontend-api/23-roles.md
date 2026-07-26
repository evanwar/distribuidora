# Roles

[← Índice](./README.md) · [Modelos TypeScript](./MODELS.md)

Total: **3 endpoints**.

## Resumen

| Método | Ruta | Auth |
|---|---|---:|
| `GET` | `/api/v1/roles` | Bearer |
| `POST` | `/api/v1/roles` | Bearer |
| `PUT` | `/api/v1/roles/{id}/permissions` | Bearer |

---

## GET /api/v1/roles

`GET /api/v1/roles`

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

## POST /api/v1/roles

`POST /api/v1/roles`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Body

Tipo: [CreateRoleRequest](./MODELS.md#create-role-request)

```json
{
  "name": "Ejemplo",
  "description": "Descripción de ejemplo"
}
```

### Respuesta exitosa

- Estado: `201` Created
- Tipo: [RoleResponseApiResponse](./MODELS.md#role-response-api-response)

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

## PUT /api/v1/roles/{id}/permissions

`PUT /api/v1/roles/{id}/permissions`

> Autenticación: `Authorization: Bearer <accessToken>`.

### Parámetros

| Nombre | Ubicación | Tipo | Requerido | Ejemplo |
|---|---|---|---:|---|
| `id` | path | string (UUID) | Sí | `{{id}}` |

### Body

Tipo: [AssignPermissionsRequest](./MODELS.md#assign-permissions-request)

```json
{
  "permissionKeys": [
    "string"
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
