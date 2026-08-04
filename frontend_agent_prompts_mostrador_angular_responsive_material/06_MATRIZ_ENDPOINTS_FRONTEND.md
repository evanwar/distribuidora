---
project: Distribuidora Frontend - MVP Mostrador
source_of_truth: ../Distribuidora/docs/frontend-api/README.md
contract_snapshot: 116 frontend operations, 32 controllers
---

# 06 - Matriz de endpoints y cobertura frontend

## Propósito

Esta matriz convierte el contrato del backend en trabajo frontend verificable. Cada operación debe quedar asociada a una pantalla, acción o servicio transversal; que exista en el cliente generado no significa que ya esté integrada en el sitio.

Fuentes de contrato:

1. OpenAPI aprobado y generado por el backend.
2. `../Distribuidora/docs/frontend-api/README.md` y sus documentos por recurso.
3. `../Distribuidora/postman/Distribuidora.Api.postman_collection.json` para pruebas manuales.

Si estas fuentes difieren, OpenAPI prevalece y se ejecuta `workflows/WF05_sincronizacion_openapi.md`. No se debe corregir el desacuerdo inventando URLs o DTOs en el frontend.

## Gate de cobertura

Un endpoint se considera integrado únicamente cuando tiene:

```text
[ ] operación disponible en el cliente generado
[ ] adapter propietario dentro de su feature
[ ] mapper DTO <-> ViewModel/request cuando aplica
[ ] pantalla o acción de UI conectada, o consumidor transversal documentado
[ ] loading/empty/error/success y errores HTTP relevantes
[ ] permiso aplicado en ruta y/o acción
[ ] prueba HTTP del adapter
[ ] prueba de componente o E2E para el flujo de negocio
```

El tablero de ejecución debe mantener los estados `pendiente`, `en progreso`, `bloqueado` o `integrado`. La meta de alcance vigente es **116/116 operaciones clasificadas e integradas**. Los endpoints administrativos no deben mezclarse en navegación de catálogos.

## Resumen por módulo

| Módulo | Recursos propietarios | Operaciones | Superficie principal |
|---|---|---:|---|
| F0 | Health | 1 | bootstrap, diagnóstico y readiness |
| F01 | Auth, Users, Roles, Permissions | 11 | acceso y seguridad |
| F02 | Customers, Suppliers, Products, ProductAliases, Categories, Brands, Units, Warehouses | 25 | maestros por dominio |
| F03 | Inventory | 7 | existencias, kardex, ajustes y transferencias |
| F04 | Purchases, GoodsReceipts | 10 | compras y recepción |
| F05 | Sales | 16 | punto de venta y facturación electrónica |
| F06 | AccountsReceivable, CustomerPayments | 7 | cobranza |
| F07 | Audit, CancellationReasons, OperationalNotes, Logs | 15 | auditoría, soporte y excepciones |
| F08 | Reports, Dashboard | 8 | indicadores y reportes |
| F09 | Settings, FolioSequences, PaymentMethods, Policies, Trace | 16 | administración y trazabilidad técnica |
| **Total** | **32 recursos** | **116** | |

## F0 - Bootstrap y diagnóstico (1)

| ID | Endpoint | Integración requerida |
|---|---|---|
| HLT-01 | `GET /api/v1/health` | readiness de arranque, diagnóstico de conectividad y smoke test; no hacer polling agresivo |

## F01 - Autenticación, usuarios y permisos (11)

| ID | Endpoint | Integración requerida |
|---|---|---|
| AUT-01 | `POST /api/v1/auth/login` | formulario de acceso y creación segura de sesión |
| AUT-02 | `POST /api/v1/auth/refresh` | renovación coordinada por interceptor/session facade |
| AUT-03 | `POST /api/v1/auth/logout` | cierre de sesión y limpieza de estado sensible |
| USR-01 | `GET /api/v1/users` | listado/búsqueda de usuarios |
| USR-02 | `POST /api/v1/users` | alta de usuario |
| USR-03 | `PUT /api/v1/users/{id}` | edición y activación/desactivación según DTO |
| USR-04 | `PUT /api/v1/users/{id}/roles` | asignación de roles |
| ROL-01 | `GET /api/v1/roles` | catálogo de roles |
| ROL-02 | `POST /api/v1/roles` | alta de rol |
| ROL-03 | `PUT /api/v1/roles/{id}/permissions` | matriz de permisos del rol |
| PER-01 | `GET /api/v1/permissions` | catálogo autoritativo para guards, navegación y matriz |

## F02 - Maestros de operación (25)

Cada maestro debe tener ruta propia y nombre intuitivo: `/customers`, `/suppliers`, `/products`, `/categories`, `/brands`, `/units` y `/warehouses`. “Catálogos” puede ser un grupo de navegación, nunca el único lugar donde un desarrollador encuentre clientes o proveedores.

| ID | Endpoint | Integración requerida |
|---|---|---|
| CUS-01 | `GET /api/v1/customers` | listado/búsqueda de clientes y selector reutilizable |
| CUS-02 | `POST /api/v1/customers` | alta de cliente |
| CUS-03 | `PUT /api/v1/customers/{id}` | edición de cliente |
| SUP-01 | `GET /api/v1/suppliers` | listado/búsqueda de proveedores y selector reutilizable |
| SUP-02 | `POST /api/v1/suppliers` | alta de proveedor |
| SUP-03 | `PUT /api/v1/suppliers/{id}` | edición de proveedor |
| PRD-01 | `GET /api/v1/products` | listado/búsqueda y selector de producto |
| PRD-02 | `POST /api/v1/products` | alta de producto |
| PRD-03 | `GET /api/v1/products/{id}` | detalle de producto |
| PRD-04 | `PUT /api/v1/products/{id}` | edición de producto |
| PAL-01 | `GET /api/v1/product-aliases` | aliases/códigos alternos por producto |
| PAL-02 | `POST /api/v1/product-aliases` | alta de alias |
| PAL-03 | `PUT /api/v1/product-aliases/{id}` | edición de alias |
| CAT-01 | `GET /api/v1/categories` | listado y selector de categorías |
| CAT-02 | `POST /api/v1/categories` | alta de categoría |
| CAT-03 | `PUT /api/v1/categories/{id}` | edición de categoría |
| BRD-01 | `GET /api/v1/brands` | listado y selector de marcas |
| BRD-02 | `POST /api/v1/brands` | alta de marca |
| BRD-03 | `PUT /api/v1/brands/{id}` | edición de marca |
| UNT-01 | `GET /api/v1/units` | listado y selector de unidades |
| UNT-02 | `POST /api/v1/units` | alta de unidad |
| UNT-03 | `PUT /api/v1/units/{id}` | edición de unidad |
| WHS-01 | `GET /api/v1/warehouses` | listado y selector de almacenes centrales |
| WHS-02 | `POST /api/v1/warehouses` | alta de almacén |
| WHS-03 | `PUT /api/v1/warehouses/{id}` | edición de almacén |

## F03 - Inventario (7)

| ID | Endpoint | Integración requerida |
|---|---|---|
| INV-01 | `GET /api/v1/inventory/balances` | existencias filtrables por producto/almacén |
| INV-02 | `GET /api/v1/inventory/kardex` | historial de movimientos |
| INV-03 | `GET /api/v1/inventory/low-stock` | alerta/listado de stock bajo |
| INV-04 | `POST /api/v1/inventory/adjustments` | captura de ajuste como borrador/operación inicial |
| INV-05 | `POST /api/v1/inventory/adjustments/{id}/confirm` | confirmación protegida contra doble envío |
| INV-06 | `POST /api/v1/inventory/adjustments/{id}/cancel` | cancelación con motivo cuando lo exija el DTO |
| INV-07 | `POST /api/v1/inventory/transfers` | transferencia entre almacenes centrales |

## F04 - Compras y recepción (10)

| ID | Endpoint | Integración requerida |
|---|---|---|
| PUR-01 | `GET /api/v1/purchases` | listado y filtros de compras |
| PUR-02 | `POST /api/v1/purchases` | alta de compra |
| PUR-03 | `GET /api/v1/purchases/{id}` | detalle de compra |
| PUR-04 | `PUT /api/v1/purchases/{id}` | edición de compra abierta |
| PUR-05 | `POST /api/v1/purchases/{id}/confirm` | confirmación de compra |
| PUR-06 | `POST /api/v1/purchases/{id}/cancel` | cancelación controlada |
| GRC-01 | `GET /api/v1/goods-receipts/{id}` | detalle de recepción |
| GRC-02 | `POST /api/v1/goods-receipts` | recepción total o parcial según contrato |
| GRC-03 | `POST /api/v1/goods-receipts/{id}/close` | cierre de recepción |
| GRC-04 | `POST /api/v1/goods-receipts/{id}/cancel` | cancelación de recepción |

## F05 - Punto de venta y facturación (16)

| ID | Endpoint | Integración requerida |
|---|---|---|
| SAL-01 | `GET /api/v1/counter-sales` | historial/listado de ventas |
| SAL-02 | `POST /api/v1/counter-sales` | creación de venta |
| SAL-03 | `GET /api/v1/counter-sales/{id}` | recuperación/detalle |
| SAL-04 | `PUT /api/v1/counter-sales/{id}` | actualización del documento abierto |
| SAL-05 | `POST /api/v1/counter-sales/{id}/confirm` | confirmación única y no reintentable automáticamente |
| SAL-06 | `POST /api/v1/counter-sales/{id}/payments` | registro de pagos de la venta |
| SAL-07 | `POST /api/v1/counter-sales/{id}/cancel` | cancelación con motivo |
| SAL-08 | `GET /api/v1/counter-sales/{id}/summary` | resumen autoritativo posventa |
| SAL-09 | `GET /api/v1/counter-sales/{id}/print` | obtención del comprobante imprimible |
| SAL-10 | `POST /api/v1/counter-sales/{id}/card-payment` | enviar el saldo autoritativo a la terminal Mercado Pago Point; sin reintento automático |
| SAL-11 | `GET /api/v1/counter-sales/{id}/card-payment` | consultar el estado local sincronizado por webhook hasta aprobación, rechazo o conciliación |
| SAL-12 | `GET /api/v1/sales/{saleId}/electronic-invoice` | consultar estado y UUID del CFDI desde el historial de ventas |
| SAL-13 | `POST /api/v1/sales/{saleId}/electronic-invoice` | emitir CFDI 4.0; mutación no reintentable automáticamente |
| SAL-14 | `GET /api/v1/sales/{saleId}/electronic-invoice/files/xml` | descargar XML fiscal |
| SAL-15 | `GET /api/v1/sales/{saleId}/electronic-invoice/files/pdf` | descargar representación PDF |
| SAL-16 | `POST /api/v1/sales/{saleId}/electronic-invoice/cancel` | solicitar cancelación con motivo SAT y sustitución cuando corresponda |

Dependencias de lectura del workspace POS: `PRD-01`, `CUS-01`, `WHS-01` y `PMT-01`. La feature usa contratos públicos/adapters; no importa stores internos de F02 o F09.

## F06 - Cuentas por cobrar y pagos (7)

| ID | Endpoint | Integración requerida |
|---|---|---|
| ACR-01 | `GET /api/v1/accounts-receivable` | listado y filtros de cartera |
| ACR-02 | `GET /api/v1/accounts-receivable/{id}` | detalle de cuenta |
| ACR-03 | `GET /api/v1/customers/{customerId}/statement` | estado de cuenta del cliente |
| CPY-01 | `POST /api/v1/customer-payments` | registro de pago |
| CPY-02 | `POST /api/v1/customer-payments/{id}/apply` | aplicación de pago |
| CPY-03 | `POST /api/v1/customer-payments/{id}/cancel` | cancelación controlada del pago |
| CPY-04 | `POST /api/v1/customers/{customerId}/credit-limit` | cambio de límite con confirmación y permiso |

## F07 - Auditoría, soporte y excepciones (15)

| ID | Endpoint | Integración requerida |
|---|---|---|
| AUD-01 | `GET /api/v1/logs/audit` | búsqueda de auditoría |
| AUD-02 | `GET /api/v1/logs/audit/{id}` | detalle before/after |
| AUD-03 | `GET /api/v1/logs/audit/entities/{entityName}/{entityId}` | historial por entidad y deep link |
| CRS-01 | `GET /api/v1/cancellation-reasons` | selector y administración de motivos |
| CRS-02 | `POST /api/v1/cancellation-reasons` | alta de motivo |
| CRS-03 | `PUT /api/v1/cancellation-reasons/{id}` | edición de motivo |
| OPN-01 | `POST /api/v1/operational-notes` | nota contextual asociada a una operación |
| LOG-01 | `GET /api/v1/logs/activity` | listado de actividad |
| LOG-02 | `GET /api/v1/logs/activity/{id}` | detalle de actividad |
| LOG-03 | `GET /api/v1/logs/errors` | bandeja de errores operativos |
| LOG-04 | `GET /api/v1/logs/errors/{id}` | detalle y correlationId |
| LOG-05 | `POST /api/v1/logs/errors/{id}/resolve` | marcar error como resuelto |
| LOG-06 | `POST /api/v1/logs/errors/{id}/reopen` | reabrir error |
| LOG-07 | `GET /api/v1/logs/events` | listado de eventos del sistema |
| LOG-08 | `GET /api/v1/logs/events/{eventId}` | detalle de evento |

Las cancelaciones de ventas, compras, recepciones e inventario permanecen en sus features propietarias (`SAL-07`, `PUR-06`, `GRC-04`, `INV-06`) y reutilizan el selector/diálogo de motivo; F07 no duplica sus adapters.

## F08 - Dashboard y reportes (8)

| ID | Endpoint | Integración requerida |
|---|---|---|
| DSH-01 | `GET /api/v1/dashboard/summary` | resumen operativo inicial |
| RPT-01 | `GET /api/v1/reports/sales-summary` | ventas por periodo |
| RPT-02 | `GET /api/v1/reports/sales-by-product` | ventas por producto |
| RPT-03 | `GET /api/v1/reports/gross-profit` | utilidad bruta entregada por backend |
| RPT-04 | `GET /api/v1/reports/inventory-summary` | resumen de inventario |
| RPT-05 | `GET /api/v1/reports/low-stock` | reporte de stock bajo |
| RPT-06 | `GET /api/v1/reports/purchases-summary` | resumen de compras |
| RPT-07 | `GET /api/v1/reports/accounts-receivable-aging` | antigüedad de saldos |

No se debe mostrar botón de exportación mientras OpenAPI no exponga una operación de exportación. Las gráficas consumen agregados; no calculan métricas desde transacciones descargadas.

## F09 - Administración y trazabilidad técnica (16)

| ID | Endpoint | Integración requerida |
|---|---|---|
| SET-01 | `GET /api/v1/admin/settings` | configuración disponible |
| SET-02 | `PUT /api/v1/admin/settings/{key}` | edición de una clave permitida |
| FOL-01 | `GET /api/v1/admin/folio-sequences` | listado de secuencias |
| FOL-02 | `POST /api/v1/admin/folio-sequences` | alta de secuencia |
| FOL-03 | `PUT /api/v1/admin/folio-sequences/{id}` | edición de secuencia |
| PMT-01 | `GET /api/v1/admin/payment-methods` | métodos de pago y selector público |
| PMT-02 | `POST /api/v1/admin/payment-methods` | alta de método |
| PMT-03 | `PUT /api/v1/admin/payment-methods/{id}` | edición de método |
| PLC-01 | `GET /api/v1/admin/policies/credit` | consulta de política de crédito |
| PLC-02 | `PUT /api/v1/admin/policies/credit` | actualización de política de crédito |
| PLC-03 | `GET /api/v1/admin/policies/inventory` | consulta de política de inventario |
| PLC-04 | `PUT /api/v1/admin/policies/inventory` | actualización de política de inventario |
| TRC-01 | `GET /api/v1/trace/operations/{operationId}` | traza por operación |
| TRC-02 | `GET /api/v1/trace/correlations/{correlationId}` | traza desde errores visibles |
| TRC-03 | `GET /api/v1/trace/documents/{folio}` | traza por folio |
| TRC-04 | `GET /api/v1/trace/events/{eventId}` | traza por evento |

## Navegación y ownership

```text
Inicio
Venta
  Punto de venta
  Historial de ventas
Inventario
  Existencias
  Kardex
  Ajustes
  Transferencias
Compras
  Órdenes de compra
  Recepciones
Cobranza
  Cuentas por cobrar
  Estados de cuenta
  Pagos
Maestros
  Clientes
  Proveedores
  Productos
  Categorías
  Marcas
  Unidades
  Almacenes
Reportes
Auditoría y soporte
Administración
  Usuarios y roles
  Configuración
  Folios
  Métodos de pago
  Políticas
  Trazabilidad
```

Las rutas, carpetas, títulos y permisos deben utilizar estos conceptos de negocio. Evitar controladores o features genéricas como `CatalogsController`/`catalogs/` para clientes, proveedores o productos.
