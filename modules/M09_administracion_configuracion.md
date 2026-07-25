---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# M09 - Administración y configuración

## Prompt para agente

```text
Eres un agente senior de backend .NET especializado en configuración de sistemas. Implementa parámetros del MVP de mostrador: folios, políticas de inventario, políticas de crédito, métodos de pago y parámetros generales. No agregues configuraciones de reparto.
```

## Fase

Sprint 6

## Dependencias

```text
M01
M02
M03
M05
M06
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

Permitir configurar reglas operativas del sistema sin hardcodearlas en handlers.

## Alcance mínimo

Implementar configuración general, folios por documento, métodos de pago, políticas de stock negativo, crédito y cancelaciones.

## Entidades / tablas mínimas

- SystemSetting: key, value, dataType, description, module, updatedBy, updatedAt
- FolioSequence: documentType, prefix, currentNumber, padding, active
- PaymentMethod: code, name, requiresReference, active
- CreditPolicy: allowCreditSales, defaultDueDays, requireAuthorizationOverLimit, active
- InventoryPolicy: allowNegativeStock, requireReasonForAdjustment, active

## Endpoints mínimos

- GET /api/admin/settings
- PUT /api/admin/settings/{key}
- GET/POST/PUT /api/admin/folio-sequences
- GET/POST/PUT /api/admin/payment-methods
- GET/PUT /api/admin/credit-policy
- GET/PUT /api/admin/inventory-policy

## Reglas de negocio

- Los folios deben generarse transaccionalmente.
- No reutilizar folios cancelados.
- Métodos de pago inactivos no se usan en nuevas ventas.
- Políticas deben leerse desde Application mediante interfaz.
- Cambios de configuración crítica generan auditoría.
- No hardcodear reglas que pueden variar por negocio.

## Validaciones mínimas

- Key de setting única.
- Tipo de dato compatible con valor.
- Prefijo de folio válido.
- Número actual no puede retroceder salvo permiso especial.
- Método de pago con código único.
- Días de crédito no negativos.

## Domain Events sugeridos

- SystemSettingChangedDomainEvent
- FolioSequenceChangedDomainEvent
- PaymentMethodCreatedDomainEvent
- CreditPolicyChangedDomainEvent
- InventoryPolicyChangedDomainEvent

## Vertical slices sugeridos

- GetSettings
- UpdateSetting
- CreateFolioSequence
- UpdateFolioSequence
- CreatePaymentMethod
- UpdatePaymentMethod
- UpdateCreditPolicy
- UpdateInventoryPolicy

## Persistencia EF Core / PostgreSQL

- Crear configuraciones con `IEntityTypeConfiguration<T>`.
- Usar claves primarias `Guid` o `Ulid` de forma consistente.
- Definir índices únicos en claves naturales como folio, SKU, código de barras, email o RFC cuando aplique.
- Usar `numeric(18,2)` para dinero y `numeric(18,4)` para cantidades.
- Agregar campos auditables.
- Usar `RowVersion` o token de concurrencia en documentos críticos y balances.
- Incluir migración con nombre: `AddAdministrationSettingsAndPolicies`.

## Seguridad y permisos

- Permisos: admin.view, admin.configure, admin.manage_folios, admin.manage_payment_methods.
- Auditar cambios de políticas, folios y métodos de pago.

## Pruebas mínimas

- folio se genera incremental
- folio cancelado no se reutiliza
- método inactivo no se acepta en venta
- cambio de política genera auditoría
- setting valida tipo de dato

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
