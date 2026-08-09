// Generado desde 06_MATRIZ_ENDPOINTS_FRONTEND.md. No editar manualmente.
export type ApiMethod = 'GET' | 'POST' | 'PUT';

export interface EndpointDefinition {
  readonly id: string;
  readonly method: ApiMethod;
  readonly path: string;
  readonly description: string;
  readonly module: string;
  readonly moduleLabel: string;
}

export const ENDPOINT_CATALOG: readonly EndpointDefinition[] = [
  {
    "id": "HLT-01",
    "method": "GET",
    "path": "/api/v1/health",
    "description": "readiness de arranque, diagnóstico de conectividad y smoke test; no hacer polling agresivo",
    "module": "F0",
    "moduleLabel": "Bootstrap y diagnóstico"
  },
  {
    "id": "AUT-01",
    "method": "POST",
    "path": "/api/v1/auth/login",
    "description": "formulario de acceso y creación segura de sesión",
    "module": "F01",
    "moduleLabel": "Autenticación, usuarios y permisos"
  },
  {
    "id": "AUT-02",
    "method": "POST",
    "path": "/api/v1/auth/refresh",
    "description": "renovación coordinada por interceptor/session facade",
    "module": "F01",
    "moduleLabel": "Autenticación, usuarios y permisos"
  },
  {
    "id": "AUT-03",
    "method": "POST",
    "path": "/api/v1/auth/logout",
    "description": "cierre de sesión y limpieza de estado sensible",
    "module": "F01",
    "moduleLabel": "Autenticación, usuarios y permisos"
  },
  {
    "id": "USR-01",
    "method": "GET",
    "path": "/api/v1/users",
    "description": "listado/búsqueda de usuarios",
    "module": "F01",
    "moduleLabel": "Autenticación, usuarios y permisos"
  },
  {
    "id": "USR-02",
    "method": "POST",
    "path": "/api/v1/users",
    "description": "alta de usuario",
    "module": "F01",
    "moduleLabel": "Autenticación, usuarios y permisos"
  },
  {
    "id": "USR-03",
    "method": "PUT",
    "path": "/api/v1/users/{id}",
    "description": "edición y activación/desactivación según DTO",
    "module": "F01",
    "moduleLabel": "Autenticación, usuarios y permisos"
  },
  {
    "id": "USR-04",
    "method": "PUT",
    "path": "/api/v1/users/{id}/roles",
    "description": "asignación de roles",
    "module": "F01",
    "moduleLabel": "Autenticación, usuarios y permisos"
  },
  {
    "id": "ROL-01",
    "method": "GET",
    "path": "/api/v1/roles",
    "description": "catálogo de roles",
    "module": "F01",
    "moduleLabel": "Autenticación, usuarios y permisos"
  },
  {
    "id": "ROL-02",
    "method": "POST",
    "path": "/api/v1/roles",
    "description": "alta de rol",
    "module": "F01",
    "moduleLabel": "Autenticación, usuarios y permisos"
  },
  {
    "id": "ROL-03",
    "method": "PUT",
    "path": "/api/v1/roles/{id}/permissions",
    "description": "matriz de permisos del rol",
    "module": "F01",
    "moduleLabel": "Autenticación, usuarios y permisos"
  },
  {
    "id": "PER-01",
    "method": "GET",
    "path": "/api/v1/permissions",
    "description": "catálogo autoritativo para guards, navegación y matriz",
    "module": "F01",
    "moduleLabel": "Autenticación, usuarios y permisos"
  },
  {
    "id": "CUS-01",
    "method": "GET",
    "path": "/api/v1/customers",
    "description": "listado/búsqueda de clientes y selector reutilizable",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "CUS-02",
    "method": "POST",
    "path": "/api/v1/customers",
    "description": "alta de cliente",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "CUS-03",
    "method": "PUT",
    "path": "/api/v1/customers/{id}",
    "description": "edición de cliente",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "SUP-01",
    "method": "GET",
    "path": "/api/v1/suppliers",
    "description": "listado/búsqueda de proveedores y selector reutilizable",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "SUP-02",
    "method": "POST",
    "path": "/api/v1/suppliers",
    "description": "alta de proveedor",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "SUP-03",
    "method": "PUT",
    "path": "/api/v1/suppliers/{id}",
    "description": "edición de proveedor",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "PRD-01",
    "method": "GET",
    "path": "/api/v1/products",
    "description": "listado/búsqueda y selector de producto",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "PRD-02",
    "method": "POST",
    "path": "/api/v1/products",
    "description": "alta de producto",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "PRD-03",
    "method": "GET",
    "path": "/api/v1/products/{id}",
    "description": "detalle de producto",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "PRD-04",
    "method": "PUT",
    "path": "/api/v1/products/{id}",
    "description": "edición de producto",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "PAL-01",
    "method": "GET",
    "path": "/api/v1/product-aliases",
    "description": "aliases/códigos alternos por producto",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "PAL-02",
    "method": "POST",
    "path": "/api/v1/product-aliases",
    "description": "alta de alias",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "PAL-03",
    "method": "PUT",
    "path": "/api/v1/product-aliases/{id}",
    "description": "edición de alias",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "CAT-01",
    "method": "GET",
    "path": "/api/v1/categories",
    "description": "listado y selector de categorías",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "CAT-02",
    "method": "POST",
    "path": "/api/v1/categories",
    "description": "alta de categoría",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "CAT-03",
    "method": "PUT",
    "path": "/api/v1/categories/{id}",
    "description": "edición de categoría",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "BRD-01",
    "method": "GET",
    "path": "/api/v1/brands",
    "description": "listado y selector de marcas",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "BRD-02",
    "method": "POST",
    "path": "/api/v1/brands",
    "description": "alta de marca",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "BRD-03",
    "method": "PUT",
    "path": "/api/v1/brands/{id}",
    "description": "edición de marca",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "UNT-01",
    "method": "GET",
    "path": "/api/v1/units",
    "description": "listado y selector de unidades",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "UNT-02",
    "method": "POST",
    "path": "/api/v1/units",
    "description": "alta de unidad",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "UNT-03",
    "method": "PUT",
    "path": "/api/v1/units/{id}",
    "description": "edición de unidad",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "WHS-01",
    "method": "GET",
    "path": "/api/v1/warehouses",
    "description": "listado y selector de almacenes centrales",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "WHS-02",
    "method": "POST",
    "path": "/api/v1/warehouses",
    "description": "alta de almacén",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "WHS-03",
    "method": "PUT",
    "path": "/api/v1/warehouses/{id}",
    "description": "edición de almacén",
    "module": "F02",
    "moduleLabel": "Maestros de operación"
  },
  {
    "id": "INV-01",
    "method": "GET",
    "path": "/api/v1/inventory/balances",
    "description": "existencias filtrables por producto/almacén",
    "module": "F03",
    "moduleLabel": "Inventario"
  },
  {
    "id": "INV-02",
    "method": "GET",
    "path": "/api/v1/inventory/kardex",
    "description": "historial de movimientos",
    "module": "F03",
    "moduleLabel": "Inventario"
  },
  {
    "id": "INV-03",
    "method": "GET",
    "path": "/api/v1/inventory/low-stock",
    "description": "alerta/listado de stock bajo",
    "module": "F03",
    "moduleLabel": "Inventario"
  },
  {
    "id": "INV-04",
    "method": "POST",
    "path": "/api/v1/inventory/adjustments",
    "description": "captura de ajuste como borrador/operación inicial",
    "module": "F03",
    "moduleLabel": "Inventario"
  },
  {
    "id": "INV-05",
    "method": "POST",
    "path": "/api/v1/inventory/adjustments/{id}/confirm",
    "description": "confirmación protegida contra doble envío",
    "module": "F03",
    "moduleLabel": "Inventario"
  },
  {
    "id": "INV-06",
    "method": "POST",
    "path": "/api/v1/inventory/adjustments/{id}/cancel",
    "description": "cancelación con motivo cuando lo exija el DTO",
    "module": "F03",
    "moduleLabel": "Inventario"
  },
  {
    "id": "INV-07",
    "method": "POST",
    "path": "/api/v1/inventory/transfers",
    "description": "transferencia entre almacenes centrales",
    "module": "F03",
    "moduleLabel": "Inventario"
  },
  {
    "id": "PUR-01",
    "method": "GET",
    "path": "/api/v1/purchases",
    "description": "listado y filtros de compras",
    "module": "F04",
    "moduleLabel": "Compras y recepción"
  },
  {
    "id": "PUR-02",
    "method": "POST",
    "path": "/api/v1/purchases",
    "description": "alta de compra",
    "module": "F04",
    "moduleLabel": "Compras y recepción"
  },
  {
    "id": "PUR-03",
    "method": "GET",
    "path": "/api/v1/purchases/{id}",
    "description": "detalle de compra",
    "module": "F04",
    "moduleLabel": "Compras y recepción"
  },
  {
    "id": "PUR-04",
    "method": "PUT",
    "path": "/api/v1/purchases/{id}",
    "description": "edición de compra abierta",
    "module": "F04",
    "moduleLabel": "Compras y recepción"
  },
  {
    "id": "PUR-05",
    "method": "POST",
    "path": "/api/v1/purchases/{id}/confirm",
    "description": "confirmación de compra",
    "module": "F04",
    "moduleLabel": "Compras y recepción"
  },
  {
    "id": "PUR-06",
    "method": "POST",
    "path": "/api/v1/purchases/{id}/cancel",
    "description": "cancelación controlada",
    "module": "F04",
    "moduleLabel": "Compras y recepción"
  },
  {
    "id": "GRC-01",
    "method": "GET",
    "path": "/api/v1/goods-receipts/{id}",
    "description": "detalle de recepción",
    "module": "F04",
    "moduleLabel": "Compras y recepción"
  },
  {
    "id": "GRC-02",
    "method": "POST",
    "path": "/api/v1/goods-receipts",
    "description": "recepción total o parcial según contrato",
    "module": "F04",
    "moduleLabel": "Compras y recepción"
  },
  {
    "id": "GRC-03",
    "method": "POST",
    "path": "/api/v1/goods-receipts/{id}/close",
    "description": "cierre de recepción",
    "module": "F04",
    "moduleLabel": "Compras y recepción"
  },
  {
    "id": "GRC-04",
    "method": "POST",
    "path": "/api/v1/goods-receipts/{id}/cancel",
    "description": "cancelación de recepción",
    "module": "F04",
    "moduleLabel": "Compras y recepción"
  },
  {
    "id": "SAL-01",
    "method": "GET",
    "path": "/api/v1/counter-sales",
    "description": "historial/listado de ventas",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-02",
    "method": "POST",
    "path": "/api/v1/counter-sales",
    "description": "creación de venta",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-03",
    "method": "GET",
    "path": "/api/v1/counter-sales/{id}",
    "description": "recuperación/detalle",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-04",
    "method": "PUT",
    "path": "/api/v1/counter-sales/{id}",
    "description": "actualización del documento abierto",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-05",
    "method": "POST",
    "path": "/api/v1/counter-sales/{id}/confirm",
    "description": "confirmación única y no reintentable automáticamente",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-06",
    "method": "POST",
    "path": "/api/v1/counter-sales/{id}/payments",
    "description": "registro de pagos de la venta",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-07",
    "method": "POST",
    "path": "/api/v1/counter-sales/{id}/cancel",
    "description": "cancelación con motivo",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-08",
    "method": "GET",
    "path": "/api/v1/counter-sales/{id}/summary",
    "description": "resumen autoritativo posventa",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-09",
    "method": "GET",
    "path": "/api/v1/counter-sales/{id}/print",
    "description": "obtención del comprobante imprimible",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-10",
    "method": "POST",
    "path": "/api/v1/counter-sales/{id}/card-payment",
    "description": "enviar el saldo autoritativo a la terminal Mercado Pago Point; sin reintento automático",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-11",
    "method": "GET",
    "path": "/api/v1/counter-sales/{id}/card-payment",
    "description": "consultar el estado local sincronizado por webhook hasta aprobación, rechazo o conciliación",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-12",
    "method": "GET",
    "path": "/api/v1/sales/{saleId}/electronic-invoice",
    "description": "consultar estado y UUID del CFDI desde el historial de ventas",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-13",
    "method": "POST",
    "path": "/api/v1/sales/{saleId}/electronic-invoice",
    "description": "emitir CFDI 4.0; mutación no reintentable automáticamente",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-14",
    "method": "GET",
    "path": "/api/v1/sales/{saleId}/electronic-invoice/files/xml",
    "description": "descargar XML fiscal",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-15",
    "method": "GET",
    "path": "/api/v1/sales/{saleId}/electronic-invoice/files/pdf",
    "description": "descargar representación PDF",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-16",
    "method": "POST",
    "path": "/api/v1/sales/{saleId}/electronic-invoice/cancel",
    "description": "solicitar cancelación con motivo SAT y sustitución cuando corresponda",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-17",
    "method": "GET",
    "path": "/api/v1/counter-sales/{saleId}/billing-eligibility",
    "description": "consultar elegibilidad y siguiente acción fiscal antes de abrir o emitir factura",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-18",
    "method": "PUT",
    "path": "/api/v1/counter-sales/{saleId}/billing-recipient",
    "description": "asociar receptor fiscal posterior sin modificar el cliente comercial de la venta",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-19",
    "method": "GET",
    "path": "/api/v1/counter-sales/{saleId}/fiscal-status",
    "description": "consultar cobertura global/nominativa y estado de conciliación",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-20",
    "method": "PUT",
    "path": "/api/v1/counter-sales/{saleId}/fiscal-coverage",
    "description": "conciliación administrativa protegida; no disponible al cajero",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "SAL-21",
    "method": "POST",
    "path": "/api/v1/counter-sales/{id}/card-payment/cancel",
    "description": "cancelar una orden pendiente o enviada y liberar la terminal; confirmación explícita, sin reintento automático",
    "module": "F05",
    "moduleLabel": "Punto de venta y facturación"
  },
  {
    "id": "ACR-01",
    "method": "GET",
    "path": "/api/v1/accounts-receivable",
    "description": "listado y filtros de cartera",
    "module": "F06",
    "moduleLabel": "Cuentas por cobrar y pagos"
  },
  {
    "id": "ACR-02",
    "method": "GET",
    "path": "/api/v1/accounts-receivable/{id}",
    "description": "detalle de cuenta",
    "module": "F06",
    "moduleLabel": "Cuentas por cobrar y pagos"
  },
  {
    "id": "ACR-03",
    "method": "GET",
    "path": "/api/v1/customers/{customerId}/statement",
    "description": "estado de cuenta del cliente",
    "module": "F06",
    "moduleLabel": "Cuentas por cobrar y pagos"
  },
  {
    "id": "CPY-01",
    "method": "POST",
    "path": "/api/v1/customer-payments",
    "description": "registro de pago",
    "module": "F06",
    "moduleLabel": "Cuentas por cobrar y pagos"
  },
  {
    "id": "CPY-02",
    "method": "POST",
    "path": "/api/v1/customer-payments/{id}/apply",
    "description": "aplicación de pago",
    "module": "F06",
    "moduleLabel": "Cuentas por cobrar y pagos"
  },
  {
    "id": "CPY-03",
    "method": "POST",
    "path": "/api/v1/customer-payments/{id}/cancel",
    "description": "cancelación controlada del pago",
    "module": "F06",
    "moduleLabel": "Cuentas por cobrar y pagos"
  },
  {
    "id": "CPY-04",
    "method": "POST",
    "path": "/api/v1/customers/{customerId}/credit-limit",
    "description": "cambio de límite con confirmación y permiso",
    "module": "F06",
    "moduleLabel": "Cuentas por cobrar y pagos"
  },
  {
    "id": "AUD-01",
    "method": "GET",
    "path": "/api/v1/logs/audit",
    "description": "búsqueda de auditoría",
    "module": "F07",
    "moduleLabel": "Auditoría, soporte y excepciones"
  },
  {
    "id": "AUD-02",
    "method": "GET",
    "path": "/api/v1/logs/audit/{id}",
    "description": "detalle before/after",
    "module": "F07",
    "moduleLabel": "Auditoría, soporte y excepciones"
  },
  {
    "id": "AUD-03",
    "method": "GET",
    "path": "/api/v1/logs/audit/entities/{entityName}/{entityId}",
    "description": "historial por entidad y deep link",
    "module": "F07",
    "moduleLabel": "Auditoría, soporte y excepciones"
  },
  {
    "id": "CRS-01",
    "method": "GET",
    "path": "/api/v1/cancellation-reasons",
    "description": "selector y administración de motivos",
    "module": "F07",
    "moduleLabel": "Auditoría, soporte y excepciones"
  },
  {
    "id": "CRS-02",
    "method": "POST",
    "path": "/api/v1/cancellation-reasons",
    "description": "alta de motivo",
    "module": "F07",
    "moduleLabel": "Auditoría, soporte y excepciones"
  },
  {
    "id": "CRS-03",
    "method": "PUT",
    "path": "/api/v1/cancellation-reasons/{id}",
    "description": "edición de motivo",
    "module": "F07",
    "moduleLabel": "Auditoría, soporte y excepciones"
  },
  {
    "id": "OPN-01",
    "method": "POST",
    "path": "/api/v1/operational-notes",
    "description": "nota contextual asociada a una operación",
    "module": "F07",
    "moduleLabel": "Auditoría, soporte y excepciones"
  },
  {
    "id": "LOG-01",
    "method": "GET",
    "path": "/api/v1/logs/activity",
    "description": "listado de actividad",
    "module": "F07",
    "moduleLabel": "Auditoría, soporte y excepciones"
  },
  {
    "id": "LOG-02",
    "method": "GET",
    "path": "/api/v1/logs/activity/{id}",
    "description": "detalle de actividad",
    "module": "F07",
    "moduleLabel": "Auditoría, soporte y excepciones"
  },
  {
    "id": "LOG-03",
    "method": "GET",
    "path": "/api/v1/logs/errors",
    "description": "bandeja de errores operativos",
    "module": "F07",
    "moduleLabel": "Auditoría, soporte y excepciones"
  },
  {
    "id": "LOG-04",
    "method": "GET",
    "path": "/api/v1/logs/errors/{id}",
    "description": "detalle y correlationId",
    "module": "F07",
    "moduleLabel": "Auditoría, soporte y excepciones"
  },
  {
    "id": "LOG-05",
    "method": "POST",
    "path": "/api/v1/logs/errors/{id}/resolve",
    "description": "marcar error como resuelto",
    "module": "F07",
    "moduleLabel": "Auditoría, soporte y excepciones"
  },
  {
    "id": "LOG-06",
    "method": "POST",
    "path": "/api/v1/logs/errors/{id}/reopen",
    "description": "reabrir error",
    "module": "F07",
    "moduleLabel": "Auditoría, soporte y excepciones"
  },
  {
    "id": "LOG-07",
    "method": "GET",
    "path": "/api/v1/logs/events",
    "description": "listado de eventos del sistema",
    "module": "F07",
    "moduleLabel": "Auditoría, soporte y excepciones"
  },
  {
    "id": "LOG-08",
    "method": "GET",
    "path": "/api/v1/logs/events/{eventId}",
    "description": "detalle de evento",
    "module": "F07",
    "moduleLabel": "Auditoría, soporte y excepciones"
  },
  {
    "id": "DSH-01",
    "method": "GET",
    "path": "/api/v1/dashboard/summary",
    "description": "resumen operativo inicial",
    "module": "F08",
    "moduleLabel": "Dashboard y reportes"
  },
  {
    "id": "RPT-01",
    "method": "GET",
    "path": "/api/v1/reports/sales-summary",
    "description": "ventas por periodo",
    "module": "F08",
    "moduleLabel": "Dashboard y reportes"
  },
  {
    "id": "RPT-02",
    "method": "GET",
    "path": "/api/v1/reports/sales-by-product",
    "description": "ventas por producto",
    "module": "F08",
    "moduleLabel": "Dashboard y reportes"
  },
  {
    "id": "RPT-03",
    "method": "GET",
    "path": "/api/v1/reports/gross-profit",
    "description": "utilidad bruta entregada por backend",
    "module": "F08",
    "moduleLabel": "Dashboard y reportes"
  },
  {
    "id": "RPT-04",
    "method": "GET",
    "path": "/api/v1/reports/inventory-summary",
    "description": "resumen de inventario",
    "module": "F08",
    "moduleLabel": "Dashboard y reportes"
  },
  {
    "id": "RPT-05",
    "method": "GET",
    "path": "/api/v1/reports/low-stock",
    "description": "reporte de stock bajo",
    "module": "F08",
    "moduleLabel": "Dashboard y reportes"
  },
  {
    "id": "RPT-06",
    "method": "GET",
    "path": "/api/v1/reports/purchases-summary",
    "description": "resumen de compras",
    "module": "F08",
    "moduleLabel": "Dashboard y reportes"
  },
  {
    "id": "RPT-07",
    "method": "GET",
    "path": "/api/v1/reports/accounts-receivable-aging",
    "description": "antigüedad de saldos",
    "module": "F08",
    "moduleLabel": "Dashboard y reportes"
  },
  {
    "id": "SET-01",
    "method": "GET",
    "path": "/api/v1/admin/settings",
    "description": "configuración disponible",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "SET-02",
    "method": "PUT",
    "path": "/api/v1/admin/settings/{key}",
    "description": "edición de una clave permitida",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "FOL-01",
    "method": "GET",
    "path": "/api/v1/admin/folio-sequences",
    "description": "listado de secuencias",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "FOL-02",
    "method": "POST",
    "path": "/api/v1/admin/folio-sequences",
    "description": "alta de secuencia",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "FOL-03",
    "method": "PUT",
    "path": "/api/v1/admin/folio-sequences/{id}",
    "description": "edición de secuencia",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "PMT-01",
    "method": "GET",
    "path": "/api/v1/admin/payment-methods",
    "description": "métodos de pago y selector público",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "PMT-02",
    "method": "POST",
    "path": "/api/v1/admin/payment-methods",
    "description": "alta de método",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "PMT-03",
    "method": "PUT",
    "path": "/api/v1/admin/payment-methods/{id}",
    "description": "edición de método",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "PTR-01",
    "method": "GET",
    "path": "/api/v1/admin/payment-terminals",
    "description": "listado administrativo de terminales Mercado Pago, incluidas las inactivas",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "PTR-02",
    "method": "GET",
    "path": "/api/v1/admin/payment-terminals/available",
    "description": "selector de terminales activas en el cobro POS; consumidor adicional de F05",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "PTR-03",
    "method": "GET",
    "path": "/api/v1/admin/payment-terminals/{id}",
    "description": "detalle autoritativo para edición y control de concurrencia",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "PTR-04",
    "method": "POST",
    "path": "/api/v1/admin/payment-terminals",
    "description": "alta de terminal con nombre, identificador externo y selección predeterminada",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "PTR-05",
    "method": "PUT",
    "path": "/api/v1/admin/payment-terminals/{id}",
    "description": "edición de terminal y cambio de terminal predeterminada",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "PTR-06",
    "method": "POST",
    "path": "/api/v1/admin/payment-terminals/{id}/deactivate",
    "description": "baja lógica; manejar 409 cuando exista una orden Point activa",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "PTR-07",
    "method": "POST",
    "path": "/api/v1/admin/payment-terminals/{id}/activate",
    "description": "reactivación de una terminal registrada",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "PLC-01",
    "method": "GET",
    "path": "/api/v1/admin/policies/credit",
    "description": "consulta de política de crédito",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "PLC-02",
    "method": "PUT",
    "path": "/api/v1/admin/policies/credit",
    "description": "actualización de política de crédito",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "PLC-03",
    "method": "GET",
    "path": "/api/v1/admin/policies/inventory",
    "description": "consulta de política de inventario",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "PLC-04",
    "method": "PUT",
    "path": "/api/v1/admin/policies/inventory",
    "description": "actualización de política de inventario",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "TRC-01",
    "method": "GET",
    "path": "/api/v1/trace/operations/{operationId}",
    "description": "traza por operación",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "TRC-02",
    "method": "GET",
    "path": "/api/v1/trace/correlations/{correlationId}",
    "description": "traza desde errores visibles",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "TRC-03",
    "method": "GET",
    "path": "/api/v1/trace/documents/{folio}",
    "description": "traza por folio",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  },
  {
    "id": "TRC-04",
    "method": "GET",
    "path": "/api/v1/trace/events/{eventId}",
    "description": "traza por evento",
    "module": "F09",
    "moduleLabel": "Administración y trazabilidad técnica"
  }
] as const;
