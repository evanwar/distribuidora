---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# M02 - Catálogos base para mostrador

## Prompt para agente

```text
Eres un agente senior de backend .NET especializado en catálogos maestros. Implementa productos, categorías, marcas, unidades, clientes, proveedores y almacenes de mostrador. No agregues estructuras de distribución fuera del mostrador. Respeta Clean Architecture, Vertical Slice, Domain Events y EF Core Code First con PostgreSQL.
```

## Fase

Sprint 1

## Dependencias

```text
M01
```

## Skills obligatorias

```text
../skills/skill_01_clean_architecture.md
../skills/skill_02_vertical_slice.md
../skills/skill_03_domain_events.md
../skills/skill_04_efcore_postgresql_codefirst.md
../skills/skill_05_api_validation_security.md
../skills/skill_06_testing_acceptance.md
../skills/skill_07_inventory_consistency.md
../skills/skill_08_counter_sales_consistency.md
```

## Objetivo

Crear la información maestra que alimenta inventario, compras, ventas, cobranza y reportes de mostrador.

## Alcance mínimo

Implementar CRUD con búsqueda, paginación, filtros por estatus, validaciones de duplicidad y eventos de dominio básicos. El catálogo no debe afectar inventario por sí mismo.

## Entidades / tablas mínimas

- Product: SKU, name, description, categoryId, brandId, unitId, barcode, cost, basePrice, minimumStock, active
- ProductAlias: productId, alias, active
- Category: name, description, active
- Brand: name, description, active
- Unit: name, abbreviation, allowsDecimals, active
- Customer: name, taxId optional, phone, email, address, city, creditLimit, creditBlocked, active
- Supplier: name, contactName, phone, email, address, active
- Warehouse: name, type central/counter, active

## Endpoints mínimos

- GET/POST/PUT /api/products
- GET /api/products/search
- GET/POST/PUT /api/product-aliases
- GET/POST/PUT /api/categories
- GET/POST/PUT /api/brands
- GET/POST/PUT /api/units
- GET/POST/PUT /api/customers
- GET/POST/PUT /api/suppliers
- GET/POST/PUT /api/warehouses

## Reglas de negocio

- Un producto debe tener SKU único.
- Código de barras único cuando exista.
- Un catálogo desactivado no puede usarse en nuevos documentos.
- No desactivar productos con existencia sin advertencia o permiso especial.
- Clientes con crédito bloqueado no pueden recibir venta a crédito sin autorización.
- Debe existir al menos un almacén central activo.

## Validaciones mínimas

- Nombre requerido en catálogos.
- SKU requerido y normalizado.
- Costo y precio no negativos.
- Límite de crédito no negativo.
- No duplicar alias del mismo producto.
- No desactivar cliente con saldo pendiente sin permiso.

## Domain Events sugeridos

- ProductCreatedDomainEvent
- ProductUpdatedDomainEvent
- ProductDeactivatedDomainEvent
- CustomerCreatedDomainEvent
- SupplierCreatedDomainEvent
- WarehouseCreatedDomainEvent

## Vertical slices sugeridos

- CreateProduct
- UpdateProduct
- SearchProducts
- DeactivateProduct
- CreateCustomer
- UpdateCustomer
- CreateSupplier
- UpdateSupplier
- CreateWarehouse
- UpdateWarehouse

## Persistencia EF Core / PostgreSQL

- Crear configuraciones con `IEntityTypeConfiguration<T>`.
- Usar claves primarias `Guid` o `Ulid` de forma consistente.
- Definir índices únicos en claves naturales como folio, SKU, código de barras, email o RFC cuando aplique.
- Usar `numeric(18,2)` para dinero y `numeric(18,4)` para cantidades.
- Agregar campos auditables.
- Usar `RowVersion` o token de concurrencia en documentos críticos y balances.
- Incluir migración con nombre: `AddCatalogsForCounterSales`.

## Seguridad y permisos

- Permisos: catalogs.view, catalogs.create, catalogs.edit, catalogs.deactivate.
- Solo usuarios autorizados cambian precios y costos.
- Auditar cambios de costo, precio y límite de crédito.

## Pruebas mínimas

- no permite SKU duplicado
- no permite barcode duplicado
- desactivar producto con stock requiere permiso
- cliente con crédito bloqueado se marca correctamente
- búsqueda de productos retorna activos primero

## Criterios de aceptación

- El módulo compila sin dependencias circulares.
- Los endpoints aparecen en Swagger.
- Las reglas de negocio están en Domain/Application, no en Api.
- Las migraciones aplican en PostgreSQL.
- Las pruebas unitarias y de integración del módulo pasan.
- El módulo no rompe reglas globales de inventario, auditoría ni seguridad.
- El módulo no introduce dependencias fuera del alcance de ventas por mostrador.

## Checklist para el agente antes de terminar

```text
[ ] Código compila
[ ] Migración EF Core creada
[ ] Seeds agregados si aplican
[ ] Endpoints documentados
[ ] Validadores creados
[ ] Permisos definidos
[ ] Auditoría considerada
[ ] Domain events levantados
[ ] Tests unitarios agregados
[ ] Tests de integración agregados
[ ] README/notas técnicas actualizadas si aplica
```
