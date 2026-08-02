# Contrato del API para frontend

Documentación generada desde OpenAPI para implementar la integración del frontend con Distribuidora API.

- Base URL local: `http://localhost:8080`
- Scalar: `http://localhost:8080/scalar/v1`
- Endpoints: **109**
- Funcionalidades: **30**
- Modelos: [MODELS.md](./MODELS.md)

## Convenciones

Todas las respuestas JSON siguen conceptualmente este envelope:

```ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T | null;
  message?: string | null;
  errors?: string[] | null;
  correlationId?: string | null;
}
```

Las fechas se transportan como strings ISO 8601. Los identificadores son UUID. Los importes y cantidades se transportan como `number`.

## Autenticación

1. Enviar credenciales a `POST /api/v1/auth/login`.
2. Guardar `data.accessToken` y `data.refreshToken`.
3. Enviar `Authorization: Bearer <accessToken>` en los endpoints protegidos.
4. Renovar la sesión con `POST /api/v1/auth/refresh`.
5. Enviar el refresh token a `POST /api/v1/auth/logout` al cerrar sesión.

No requieren token: health, login y refresh.

## Manejo de errores

| Estado | Acción sugerida en frontend |
|---:|---|
| 400 | Mostrar errores de validación recibidos en `errors`. |
| 401 | Intentar refresh una sola vez; si falla, cerrar sesión. |
| 403 | Mostrar acceso denegado; no reintentar. |
| 404 | Mostrar recurso no encontrado. |
| 409 | Mostrar conflicto de negocio. |
| 422 | Mostrar regla de negocio incumplida. |
| 500 | Mostrar error general y registrar `correlationId`. |

## Índice por funcionalidad

| Funcionalidad | Endpoints | Documento |
|---|---:|---|
| Health | 1 | [Abrir](./01-health.md) |
| Auth | 3 | [Abrir](./02-auth.md) |
| Customers | 3 | [Abrir](./03-customers.md) |
| Suppliers | 3 | [Abrir](./04-suppliers.md) |
| Products | 4 | [Abrir](./05-products.md) |
| ProductAliases | 3 | [Abrir](./06-product-aliases.md) |
| Categories | 3 | [Abrir](./07-categories.md) |
| Brands | 3 | [Abrir](./08-brands.md) |
| Units | 3 | [Abrir](./09-units.md) |
| Warehouses | 3 | [Abrir](./10-warehouses.md) |
| Inventory | 7 | [Abrir](./11-inventory.md) |
| Purchases | 6 | [Abrir](./12-purchases.md) |
| GoodsReceipts | 4 | [Abrir](./13-goods-receipts.md) |
| Sales | 9 | [Abrir](./14-sales.md) |
| AccountsReceivable | 3 | [Abrir](./15-accounts-receivable.md) |
| CustomerPayments | 4 | [Abrir](./16-customer-payments.md) |
| Reports | 7 | [Abrir](./17-reports.md) |
| Audit | 3 | [Abrir](./18-audit.md) |
| CancellationReasons | 3 | [Abrir](./19-cancellation-reasons.md) |
| OperationalNotes | 1 | [Abrir](./20-operational-notes.md) |
| Logs | 8 | [Abrir](./21-logs.md) |
| Users | 4 | [Abrir](./22-users.md) |
| Roles | 3 | [Abrir](./23-roles.md) |
| Permissions | 1 | [Abrir](./24-permissions.md) |
| Settings | 2 | [Abrir](./25-settings.md) |
| FolioSequences | 3 | [Abrir](./26-folio-sequences.md) |
| PaymentMethods | 3 | [Abrir](./27-payment-methods.md) |
| Policies | 4 | [Abrir](./28-policies.md) |
| Dashboard | 1 | [Abrir](./29-dashboard.md) |
| Trace | 4 | [Abrir](./30-trace.md) |

## Checklist de implementación

- Centralizar `baseURL` en una variable de ambiente del frontend.
- Implementar un cliente HTTP único con inyección del Bearer token.
- Evitar ciclos infinitos de refresh usando un único reintento por solicitud.
- Tratar `204 No Content` sin intentar deserializar JSON.
- Conservar `correlationId` al registrar errores.
- No enviar query parameters opcionales vacíos.
