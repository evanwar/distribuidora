---
project: Distribuidora SaaS Platform Evolution
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Angular 21, Angular Material 3
architecture: Modular Monolith + Tenant-aware application + Database per tenant + Separate Platform Control Plane
scope: Future SaaS, premium entitlements, white-label branding, tenant lifecycle and platform administration
status: Planning only - do not implement without explicit authorization
---

# 10 - Orquestador para evolución SaaS, multitenencia y funciones premium

## Propósito

Este documento coordina una evolución futura del sistema de mostrador hacia una plataforma comercial SaaS sin romper las reglas actuales de ventas, inventario, cobranza, auditoría y seguridad.

El objetivo es soportar, desde una sola base de código:

```text
SaaS compartido
SaaS con marca blanca
instancia dedicada por cliente
API como servicio
instalación privada, si se autoriza como modalidad comercial futura
```

Este documento es de planeación. Su existencia no autoriza migraciones, despliegues, cambios de datos, creación de infraestructura, integración de cobros ni modificación del comportamiento actual.

## Documentos obligatorios previos

Todo agente que participe debe leer, como mínimo:

```text
00_ORQUESTADOR.md
01_CONTEXTO_NEGOCIO_Y_ALCANCE.md
modules/M01_seguridad_usuarios_permisos.md
modules/M03_inventario_existencias_kardex.md
modules/M05_ventas_por_mostrador.md
modules/M06_cobranza_cuentas_por_cobrar.md
modules/M07_auditoria_ajustes_cancelaciones.md
modules/M08_reportes_dashboard_mostrador.md
modules/M09_administracion_configuracion.md
logs/00_ORQUESTADOR_LOGS.md
frontend_agent_prompts_mostrador_angular_responsive_material/00_ORQUESTADOR.md
frontend_agent_prompts_mostrador_angular_responsive_material/AGENTS.md
frontend_agent_prompts_mostrador_angular_responsive_material/05_DESIGN_SYSTEM_MATERIAL_RESPONSIVE.md
frontend_agent_prompts_mostrador_angular_responsive_material/06_MATRIZ_ENDPOINTS_FRONTEND.md
frontend_agent_prompts_mostrador_angular_responsive_material/07_ARQUITECTURA_COMPONENTES_UX.md
```

También debe leer las skills obligatorias declaradas por los orquestadores backend y frontend.

## Decisiones arquitectónicas aprobadas para la planeación

### 1. La aplicación será tenant-aware permanentemente

No se implementará una bifurcación de código del tipo `MultitenantMode = true/false`.

La aplicación siempre conocerá el tenant actual. Una instalación de una sola empresa se representará como un único tenant.

### 2. Estrategia principal: base PostgreSQL por cliente

Cada empresa tendrá una base de datos operativa independiente:

```text
PlatformDb
  -> conoce clientes, dominios, planes, licencias y despliegues

Tenant A
  -> Database: distribuidora_tenant_a

Tenant B
  -> Database: distribuidora_tenant_b

Tenant C dedicado
  -> Database y despliegue exclusivos
```

La API compartida resolverá el tenant antes de crear el `DbContext` operativo.

No se adoptará una base compartida con `TenantId` en todas las tablas salvo que un ADR futuro demuestre que el volumen, costo y controles de aislamiento justifican el cambio.

### 3. Control plane separado del sistema del cliente

Existirán dos superficies administrativas:

```text
tenant-web
  -> operación y administración interna de cada empresa

platform-admin
  -> clientes, planes, premium, dominios, estado e infraestructura
```

El panel de plataforma deberá desplegarse preferentemente en un host separado, por ejemplo:

```text
admin.example.com
```

No se reutilizará el rol tenant `Administrator` como operador de plataforma.

### 4. Solo las funciones premium serán activables por licencia

Las funciones esenciales no podrán desactivarse individualmente por plan. Solo podrán quedar temporalmente bloqueadas por el estado global del tenant, por ejemplo `ReadOnly` o `Suspended`.

### 5. Permisos, entitlements y estado son controles diferentes

```text
TenantStatus
  -> determina si la empresa puede operar

Entitlement
  -> determina si la empresa contrató una función premium

Permission
  -> determina si el usuario puede ejecutar una acción contratada
```

Ninguno sustituye a los otros dos.

### 6. Una sola base de código

No se crearán ramas permanentes ni forks del producto por cliente. Las diferencias de nombre, logo, dominio, colores, límites, integraciones y premium deberán resolverse mediante configuración.

## Terminología obligatoria

```text
Tenant
  Empresa cliente que usa el sistema.

Platform operator
  Usuario interno autorizado para administrar el SaaS.

Entitlement
  Derecho vigente de un tenant a utilizar una función premium.

Feature definition
  Definición estable de una función licenciable.

Plan
  Agrupación comercial de funciones y límites.

Add-on
  Función premium contratada individualmente.

Control plane
  Componentes que administran tenants, planes, estado, branding y despliegues.

Data plane
  API, frontend y base de datos que procesan la operación del cliente.
```

## Capacidades esenciales no licenciables

Un tenant `Active` tendrá siempre disponibles estas capacidades, sujetas a permisos de usuario:

```text
autenticación
usuarios y roles básicos
productos, categorías, unidades y marcas
clientes y proveedores
un almacén
inventario y kardex
ajustes de inventario
compras y recepciones
ventas de contado
pagos manuales en efectivo, transferencia o tarjeta
cancelaciones con trazabilidad
folios
configuración operativa básica
auditoría mínima
reportes básicos de ventas e inventario
exportación completa de los datos propios
seguridad, respaldo e integridad de datos
```

Estas capacidades no deben convertirse en premium:

```text
autorización backend
protección de secretos
aislamiento entre clientes
integridad transaccional
auditoría mínima
respaldos mínimos
recuperación de cuenta
exportación de datos del cliente
correcciones de seguridad
```

## Catálogo inicial de funciones premium

Las claves son contratos estables. No deben renombrarse después de llegar a producción sin una migración de compatibilidad.

| Clave | Capacidad | Política al desactivar |
|---|---|---|
| `receivables.credit` | Ventas a crédito y cuentas por cobrar | Bloquear nuevo crédito; conservar consulta y cobro de saldos existentes |
| `credit.advanced_policies` | Límites y autorizaciones avanzadas de crédito | Mantener políticas históricas; usar comportamiento básico para nuevas operaciones |
| `inventory.multi_warehouse` | Almacenes adicionales y transferencias | No permitir nuevos almacenes; exigir consolidación antes del downgrade |
| `reports.financial` | Utilidad bruta y reportes financieros | Bloquear nuevas consultas premium sin eliminar datos fuente |
| `reports.receivables_aging` | Antigüedad de saldos | Bloquear el reporte; mantener cuentas y pagos |
| `reports.exports` | Exportaciones analíticas avanzadas | Conservar exportación mínima de datos propios |
| `invoicing.cfdi` | Emisión, consulta operativa y cancelación de CFDI | Bloquear nuevos timbrados; permitir consultar y descargar CFDI existentes |
| `payments.mercado_pago_point` | Terminales y cobro mediante Mercado Pago Point | Bloquear nuevas órdenes; conservar historial y conciliación pendiente |
| `audit.advanced` | Explorador de trazas, eventos, errores y exportaciones avanzadas | Conservar auditoría mínima y datos de soporte |
| `api.access` | Consumo externo de la API | Revocar clientes externos; el frontend tenant continúa operando |
| `api.webhooks` | Webhooks configurables | Detener nuevos envíos de forma auditable; conservar historial |
| `branding.white_label` | Nombre, logo, favicon y colores personalizados | Volver a la marca estándar al terminar la vigencia |
| `branding.custom_domain` | Dominio personalizado | Conservar subdominio estándar y retirar el dominio personalizado de manera programada |
| `hosting.dedicated` | API, frontend, base y almacenamiento dedicados | Requiere proceso comercial y migración; nunca realizar downgrade automático |
| `support.priority` | SLA y soporte prioritario | No cambia reglas funcionales del sistema |

## Límites comerciales

Los límites no son permisos ni booleanos. Deben modelarse como valores tipados:

```text
users.maximum
warehouses.maximum
api.requests_per_minute
api.requests_per_month
storage.maximum_gb
audit.retention_days
backup.retention_days
```

Superar un límite nunca debe borrar datos. Debe bloquear solamente la creación o consumo adicional correspondiente y mostrar instrucciones claras.

## Planes comerciales iniciales

### Essential

Incluye todas las capacidades esenciales, un almacén y reportes básicos.

### Business

Puede agrupar:

```text
receivables.credit
credit.advanced_policies
inventory.multi_warehouse
reports.financial
reports.receivables_aging
```

### Add-ons

Se contratan individualmente:

```text
invoicing.cfdi
payments.mercado_pago_point
api.access
api.webhooks
audit.advanced
branding.white_label
branding.custom_domain
```

### Dedicated

Incluye recursos aislados y se gestiona como modalidad de hosting, no como una simple bandera visual.

Los nombres, precios, monedas, impuestos y condiciones comerciales no se hardcodearán en Domain o Application.

## Estados del tenant

Estados mínimos:

```text
Provisioning
Active
PastDue
ReadOnly
Suspended
Maintenance
Decommissioned
```

### Reglas

- `Provisioning`: solo operaciones internas de aprovisionamiento.
- `Active`: operación normal según entitlements y permisos.
- `PastDue`: operación temporal con aviso y fecha límite explícita.
- `ReadOnly`: lectura y exportación permitidas; escrituras bloqueadas.
- `Suspended`: bloquear login y operación, salvo endpoints técnicos explícitamente autorizados.
- `Maintenance`: mostrar mensaje temporal y conservar integridad de procesos en curso.
- `Decommissioned`: tenant retirado; no implica eliminación inmediata de datos.

No se eliminarán datos automáticamente por falta de pago.

## Modelo de datos del control plane

Entidades mínimas sugeridas:

```text
Tenant
TenantDomain
TenantBranding
TenantDatabase
Deployment
Plan
FeatureDefinition
PlanFeature
Subscription
SubscriptionItem
TenantFeatureOverride
TenantLimitOverride
EntitlementSnapshot
UsageCounter
PlatformUser
PlatformRole
PlatformAuditLog
SupportAccessGrant
ProvisioningOperation
```

### Tenant

Campos mínimos sugeridos:

```text
Id
Slug
DisplayName
LegalName
Status
HostingMode
DefaultCulture
TimeZone
CreatedAt
UpdatedAt
SuspendedAt
SuspensionReason
```

### TenantBranding

```text
TenantId
ApplicationName
LogoUrl
CompactLogoUrl
FaviconUrl
PrimaryColor
SecondaryColor
SupportEmail
SupportPhone
HideVendorBrand
UpdatedAt
```

### TenantDatabase

No debe almacenar la contraseña en texto plano.

```text
TenantId
ServerIdentifier
DatabaseName
SecretReference
SchemaVersion
LastMigrationAt
LastBackupAt
Status
```

### Subscription y entitlements

Un entitlement efectivo se obtiene combinando:

```text
PlanFeature
+ SubscriptionItem
+ TenantFeatureOverride temporal
+ fecha de vigencia
+ estado de suscripción
```

La resolución debe producir un snapshot auditable y cacheable.

## Configuración de empresa

Separar responsabilidades:

```text
CompanyProfile
  -> razón social, nombre comercial, RFC, domicilio, moneda y zona horaria

TenantBranding
  -> nombre mostrado, logo, colores, favicon y soporte

SystemSetting
  -> parámetros operativos tipados del tenant

IntegrationCredential
  -> referencia segura a secretos externos

Subscription
  -> plan, vigencia, add-ons y límites
```

No usar `SystemSetting` para:

```text
contraseñas
API keys
connection strings
tokens OAuth
webhook secrets
estado del tenant
licencias premium
roles de plataforma
```

## Resolución del tenant

Orden de resolución recomendado:

```text
1. Host o dominio verificado
2. TenantDomain en PlatformDb
3. Estado y despliegue del tenant
4. TenantId del token autenticado
5. Coincidencia obligatoria entre dominio y token
6. Resolución de conexión operativa
7. Creación del AppDbContext del tenant
```

No aceptar `TenantId` enviado libremente por query string o body como autoridad de aislamiento.

Para operadores de plataforma o soporte, usar un flujo de impersonación temporal, explícito y auditado.

## Autenticación y autorización

### Usuarios tenant

El access token debe incluir como mínimo:

```text
sub
tenant_id
tenant_slug
permissions
session_id
```

El refresh token debe quedar ligado al tenant, usuario y sesión.

Antes de producción SaaS, migrar refresh tokens del almacenamiento accesible por JavaScript a cookies:

```text
HttpOnly
Secure
SameSite apropiado
rotación por uso
revocación por sesión
```

### Operadores de plataforma

Roles iniciales:

```text
PlatformOwner
PlatformBilling
PlatformSupport
PlatformOperations
PlatformAuditor
```

Requisitos:

```text
autenticación separada
MFA obligatorio
sesiones cortas
auditoría reforzada
sin reutilizar cuentas tenant
restricción por IP opcional
```

## Autorización premium

El control debe existir en el backend en el límite del caso de uso, antes de modificar datos o invocar un proveedor externo.

Flujo obligatorio:

```text
resolver tenant
  -> validar TenantStatus
  -> validar autenticación
  -> validar Entitlement
  -> validar Permission
  -> validar límite de uso
  -> ejecutar caso de uso
  -> registrar auditoría y consumo
```

El frontend puede ocultar navegación y acciones, pero nunca será la autoridad de licencia.

Errores estables sugeridos:

```text
TENANT_READ_ONLY
TENANT_SUSPENDED
FEATURE_NOT_ENTITLED
FEATURE_EXPIRED
USAGE_LIMIT_REACHED
CUSTOM_DOMAIN_NOT_VERIFIED
TENANT_PROVISIONING
```

## Branding y bootstrap público

Crear un endpoint público, resuelto exclusivamente por host, que entregue solo información no sensible:

```http
GET /api/v1/platform/context
```

Respuesta conceptual:

```json
{
  "tenantSlug": "cliente-a",
  "applicationName": "Comercializadora Norte",
  "logoUrl": "/tenant-assets/cliente-a/logo.svg",
  "faviconUrl": "/tenant-assets/cliente-a/favicon.ico",
  "primaryColor": "#175CD3",
  "defaultLanguage": "es",
  "status": "active",
  "enabledUiFeatures": [
    "receivables.credit",
    "reports.financial"
  ]
}
```

No exponer en ese contrato:

```text
connection strings
secret references
datos de cobro
excepciones internas de licencia
información de infraestructura
motivos privados de suspensión
```

Angular debe cargar este contexto antes de mostrar login o shell y usarlo para:

```text
document.title
favicon
logo
nombre comercial
tokens Material 3
idioma inicial
información de soporte
pantalla de mantenimiento o suspensión
navegación premium
```

## Integraciones por tenant

FiscalAPI y Mercado Pago no podrán permanecer como configuraciones globales si varios tenants usan la misma API.

Abstracciones sugeridas:

```text
ITenantSecretStore
ITenantElectronicInvoicingProviderFactory
ITenantPaymentProviderFactory
ITenantWebhookResolver
ITenantIntegrationHealthService
```

Cada tenant podrá tener:

```text
emisor fiscal
API key fiscal
tenant del proveedor fiscal
código postal de expedición
serie fiscal
cuenta Mercado Pago
application id
webhook secret
terminales
credenciales de API externa
```

Los secretos deben residir en un secret manager o mecanismo cifrado equivalente y solo referenciarse desde la base central.

### Webhooks

Todo webhook anónimo debe resolver inequívocamente el tenant mediante uno o varios identificadores confiables:

```text
URL específica del tenant
ApplicationId registrado
referencia externa opaca
firma específica del tenant
```

Nunca recorrer todas las bases buscando una coincidencia.

## Dashboard del cliente

El administrador tenant podrá gestionar únicamente su empresa:

```text
usuarios y roles
folios
métodos de pago
políticas operativas
datos de empresa
branding, si está contratado
integraciones, si están contratadas
consulta del plan
funciones y límites vigentes
solicitud de upgrade
```

No podrá:

```text
activar premium sin contratación
modificar vigencias
concederse límites
ver otros tenants
conocer secretos en texto plano
cambiar su estado global
asignarse un rol de plataforma
```

## Dashboard de plataforma

Debe ser una aplicación o entrada desplegable separada del frontend tenant.

Módulos mínimos:

### Tenants

```text
alta
aprovisionamiento
estado
dominios
branding
modalidad de hosting
historial
```

### Planes y premium

```text
planes
add-ons
límites
pruebas temporales
overrides
upgrades
downgrades programados
vigencias
```

### Suscripciones

```text
estado de pago
renovación
periodo de gracia
historial
cancelación
reactivación
```

La primera versión puede administrar suscripciones manualmente. No integrar automáticamente un proveedor de cobro hasta que exista autorización explícita y un ADR comercial/técnico.

### Operaciones

```text
base asignada
versión de esquema
migraciones
respaldos
restauraciones
almacenamiento
salud de servicios
despliegues dedicados
```

### Soporte y seguridad

```text
incidentes
errores agregados por tenant
sesiones
credenciales API
rotación de secretos
acceso temporal de soporte
auditoría de operadores
```

## Acceso temporal de soporte

No solicitar ni restablecer contraseñas de usuarios para brindar soporte.

Flujo requerido:

```text
1. Operador selecciona tenant.
2. Registra ticket y motivo.
3. Solicita un SupportAccessGrant temporal.
4. El sistema concede solo lectura por defecto.
5. La UI muestra permanentemente "Modo soporte".
6. Cada acción conserva operador real, tenant, motivo y ticket.
7. El acceso expira automáticamente.
8. Acciones sensibles pueden requerir aprobación del cliente.
```

## Suspensión global y kill switch seguro

El panel de plataforma podrá cambiar el estado del tenant, pero no eliminar datos.

Transición comercial sugerida:

```text
Active -> PastDue -> ReadOnly -> Suspended
```

Antes de suspender, mostrar:

```text
tenant afectado
dominio
estado actual y nuevo
motivo
fecha efectiva
sesiones que serán revocadas
procesos externos pendientes
periodo de conservación
```

Endpoints que pueden permanecer disponibles durante suspensión, mediante lista cerrada:

```text
health técnico
contexto público de branding/estado
renovación o reactivación autorizada
webhooks que deban cerrar transacciones iniciadas previamente
exportación del cliente, según política contractual
```

El sistema debe definir qué ocurre con pagos, facturas, outbox y webhooks en curso antes de aplicar una suspensión inmediata.

## Modalidades de despliegue

### SaaS compartido

```text
API compartida
frontend compartido
base por tenant
almacenamiento segmentado por tenant
subdominio de plataforma
```

### Marca blanca

```text
SaaS compartido o dedicado
branding configurable
dominio personalizado
correos y documentos configurables
```

### Dedicado

```text
API exclusiva
frontend exclusivo
base exclusiva
almacenamiento exclusivo
secretos exclusivos
dominio propio
monitoreo y respaldo acordados
```

### API como servicio

Además de usuarios humanos, requiere:

```text
OAuth2 client credentials o API keys rotables
scopes
rate limiting por tenant y cliente
cuotas
idempotency keys
CORS por allowlist
webhooks firmados
sandbox
versionado
política de deprecación
medición de consumo
```

### Instalación privada

Si se autoriza en el futuro:

```text
contenedores versionados
licencia firmada
renovación online u offline
migraciones controladas
contrato de soporte
telemetría acordada contractualmente
```

Una instalación privada no implica entrega de propiedad intelectual o código fuente salvo contrato explícito.

## Fases obligatorias de implementación

No avanzar a una fase posterior sin aprobar los gates de la fase actual.

### Fase S0 - ADR, catálogo comercial y amenazas

Entregables:

```text
ADR de base por tenant
ADR de control plane separado
catálogo definitivo de premium
matriz plan-feature-limit
reglas de upgrade/downgrade
modelo de amenazas multitenant
política de retención y suspensión
inventario de datos y secretos
```

Gate:

- No existe ambigüedad entre esencial, premium, límite y permiso.
- Cada downgrade tiene comportamiento definido.
- Se documentaron RPO, RTO, respaldo y restauración.
- Se definió propietario de cada dato.

### Fase S1 - Tenant context con un tenant inicial

Objetivo: hacer la aplicación tenant-aware sin ofrecer todavía varios clientes.

Entregables:

```text
ITenantContext
resolución por host
tenant_id en tokens
validación host-token
tenant en trazas y auditoría
pruebas negativas de aislamiento
migración del tenant actual
```

Gate:

- El comportamiento funcional actual no cambia para el tenant inicial.
- Ningún request autenticado opera sin tenant válido.
- Jobs y procesos en background tienen tenant explícito.
- Logs y errores identifican tenant sin revelar secretos.

### Fase S2 - PlatformDb y ciclo de vida

Entregables:

```text
PlatformDbContext
Tenant
TenantDomain
TenantDatabase
estados
provisioning idempotente
migración por tenant
backup y restore por tenant
```

Gate:

- Crear un tenant es idempotente y auditable.
- Un fallo parcial de aprovisionamiento puede reanudarse.
- Restore se probó en un entorno aislado.
- Las connection strings no aparecen en respuestas ni logs.

### Fase S3 - Branding y configuración de empresa

Entregables:

```text
CompanyProfile
TenantBranding
endpoint público de contexto
carga previa en Angular
title, favicon, logo y tema dinámicos
pantallas de estado
```

Gate:

- El login ya no contiene marca hardcodeada.
- La UI conserva accesibilidad y contraste con colores permitidos.
- Assets están aislados por tenant.
- No se filtra información privada en el bootstrap público.

### Fase S4 - Entitlements y premium

Entregables:

```text
FeatureDefinition
Plan
Subscription
resolución de entitlements
cache con expiración
backend feature policies
frontend feature guards
límites tipados
auditoría de cambios
```

Gate:

- Cada premium tiene pruebas enabled/disabled/expired.
- Llamar la API directamente no evade el bloqueo.
- Desactivar premium no elimina historial.
- Fallar el control plane temporalmente no suspende tenants activos de manera accidental.

### Fase S5 - Integraciones por tenant

Entregables:

```text
secret store
FiscalAPI por tenant
Mercado Pago por tenant
terminales por tenant
webhook tenant resolution
rotación de secretos
health por integración
```

Gate:

- Una credencial tenant no puede usarse en otro tenant.
- Webhooks resuelven un solo tenant de forma determinista.
- CFDI y pagos pendientes tienen política de suspensión.
- Los secretos nunca se devuelven completos.

### Fase S6 - Dashboard de plataforma

Entregables:

```text
platform-admin Angular
autenticación de operadores
MFA
RBAC de plataforma
gestión de tenants
gestión de planes y premium
estados y suspensión
auditoría de operadores
modo soporte temporal
```

Gate:

- Una cuenta tenant no puede entrar al panel de plataforma.
- Un operador sin rol no puede elevar sus permisos.
- Toda acción crítica registra before/after, motivo y operador.
- Suspensión y reactivación fueron probadas con procesos pendientes.

### Fase S7 - API comercial y medición

Entregables:

```text
clientes de máquina
scopes
credenciales rotables
rate limits tenant-aware
cuotas
usage counters
webhooks salientes
sandbox
documentación versionada
```

Gate:

- No existen credenciales globales compartidas entre clientes.
- Cuotas no afectan a otros tenants.
- Idempotencia evita operaciones financieras duplicadas.
- Existe política de revocación y rotación.

### Fase S8 - Hosting dedicado y operación

Entregables:

```text
plantilla de despliegue
registro de deployments
migración shared-to-dedicated
rollback
monitoring
backup
restore
runbooks
```

Gate:

- La misma versión funcional opera en compartido y dedicado.
- No existen cambios manuales no reproducibles por cliente.
- Se probó migración y rollback con datos representativos.
- El despliegue dedicado continúa obedeciendo entitlements acordados.

## Orden de agentes sugerido

```text
Agente A - Arquitectura, ADR y amenazas
Agente B - Control plane y modelo de datos
Agente C - Tenant resolution y seguridad
Agente D - Provisioning, migraciones y respaldos
Agente E - Entitlements y límites
Agente F - Branding backend/frontend
Agente G - Integraciones por tenant
Agente H - Platform Admin backend
Agente I - Platform Admin Angular/UX
Agente J - API comercial y medición
Agente K - QA multitenant, seguridad y recuperación
Agente L - Operación, observabilidad y despliegue dedicado
```

Los agentes no deben trabajar simultáneamente sobre migraciones, autenticación o resolución de tenant sin coordinación explícita.

## Contrato de entrada para cada agente

Cada tarea debe declarar:

```text
fase
tenant model vigente
ADRs aprobados
feature keys afectadas
tablas afectadas
endpoints afectados
estrategia de migración
riesgos de aislamiento
pruebas requeridas
rollback esperado
```

## Contrato de salida para cada agente

```md
## Resumen
Qué implementó y qué fase cubre.

## Decisiones aplicadas
ADRs, premium keys, límites y estados involucrados.

## Aislamiento tenant
Cómo se resuelve tenant y cómo se impide acceso cruzado.

## Archivos creados/modificados
Lista por Backend, Tenant Web, Platform Admin, Infrastructure y documentación.

## Modelo de datos y migraciones
PlatformDb, TenantDb, índices, restricciones, compatibilidad y rollback.

## Endpoints
Método, ruta, audiencia, permiso, entitlement, estado permitido y respuestas de error.

## Seguridad y secretos
Claims, cookies, credenciales, rotación, redacción y auditoría.

## UX y branding
Comportamiento tenant, premium, responsive, accesibilidad y estados suspendidos.

## Pruebas
Unitarias, integración, aislamiento, E2E, migración, restore y seguridad.

## Evidencia de calidad
Build, test, lint, migraciones y escenarios ejecutados.

## Riesgos y pendientes
Decisiones humanas o comerciales requeridas.
```

## Matriz mínima de pruebas de aislamiento

Para cada endpoint con datos tenant:

```text
Tenant A puede acceder a un recurso A permitido.
Tenant A no puede acceder a un identificador de Tenant B.
Tenant A no puede cambiar tenant por header, body o query.
Token A no funciona en dominio B.
Refresh token A no crea sesión B.
Un job A no modifica datos B.
Un webhook A no se procesa en B.
Una exportación A no incluye datos B.
Una búsqueda global no cruza bases tenant.
Logs y reportes respetan el contexto.
```

La respuesta ante identificadores de otro tenant no debe confirmar innecesariamente la existencia del recurso.

## Matriz mínima de pruebas premium

Para cada feature premium:

```text
enabled + permiso -> operación permitida
enabled + sin permiso -> 403
disabled + permiso -> FEATURE_NOT_ENTITLED
expired -> FEATURE_EXPIRED o comportamiento de gracia definido
ReadOnly -> lecturas permitidas y escrituras bloqueadas
Suspended -> operación bloqueada
downgrade -> historial conservado
upgrade -> función disponible sin redeploy
```

## Migraciones y aprovisionamiento

Reglas obligatorias:

- Las migraciones tenant deben ser versionadas e idempotentes en el nivel de orquestación.
- No activar migraciones masivas automáticas sin estrategia de lotes, observabilidad y rollback.
- Registrar por tenant versión, inicio, fin, resultado y error sanitizado.
- Detener un lote si se supera el umbral de fallos acordado.
- Probar backup antes de migraciones destructivas.
- Nunca ejecutar una migración tenant usando una conexión no verificada.
- No permitir que una base con versión incompatible reciba tráfico de escritura.

## Observabilidad

Toda señal técnica debe incluir cuando corresponda:

```text
TenantId
DeploymentId
ApplicationVersion
DatabaseSchemaVersion
CorrelationId
OperationId
TraceId
FeatureKey
PlatformOperatorId
SupportGrantId
```

No incluir nombres, RFC, tokens, connection strings o secretos en etiquetas de alta cardinalidad.

Las vistas agregadas de plataforma no deben dar a operadores acceso indiscriminado al contenido comercial del tenant.

## Disponibilidad del control plane

Una caída temporal de `PlatformDb` no debe suspender automáticamente tenants previamente activos.

Implementar:

```text
entitlement snapshot firmado o verificable
cache local/distribuido con expiración
periodo de gracia
último estado conocido
alerta operativa
fail-safe definido por tipo de operación
```

Las concesiones nuevas o reactivaciones sí pueden requerir disponibilidad del control plane.

## Reglas de seguridad no negociables

1. El tenant nunca se elige confiando únicamente en datos enviados por el cliente.
2. Host, token y contexto deben coincidir.
3. No existe un `DbContext` operativo sin tenant resuelto.
4. Los jobs deben enumerar tenants explícitamente y crear un scope por tenant.
5. Los secretos se almacenan fuera de settings generales.
6. Los operadores de plataforma usan identidad separada y MFA.
7. Todo acceso de soporte es temporal, visible y auditable.
8. Las licencias se validan en backend.
9. Deshabilitar una función no borra historia.
10. Suspender no equivale a eliminar.
11. Ninguna empresa puede consumir cuota, credencial o integración de otra.
12. Los folios, idempotency keys y referencias externas deben ser correctos dentro de su aislamiento.
13. Procesos financieros e inventario mantienen las reglas transaccionales actuales.
14. No se debilita auditoría, respaldo o seguridad para diferenciar planes.

## Reglas de UX

- No mostrar rutas premium deshabilitadas como errores 404 ambiguos dentro del panel tenant.
- Mostrar la función contratada, no contratada, en prueba o expirada de manera clara.
- No usar modales agresivos de venta durante una operación crítica de mostrador.
- El POS debe conservar velocidad y flujo de teclado.
- `ReadOnly`, `Maintenance` y `Suspended` necesitan pantallas diferenciadas.
- El branding dinámico debe conservar contraste WCAG y Material 3.
- Un downgrade debe explicar qué acciones nuevas se bloquearán y qué datos seguirán disponibles.
- La administración de plataforma debe ser responsive, pero priorizar seguridad y claridad sobre personalización visual.

## Reglas de API y compatibilidad

- No romper operaciones tenant existentes sin versionado o periodo de transición.
- Agregar contratos de error estables para estado, entitlement y límites.
- No exponer modelos internos de suscripción en respuestas tenant.
- Mantener OpenAPI separado o claramente segmentado para API tenant y API de plataforma.
- El cliente Angular generado no debe editarse manualmente.
- Las APIs de plataforma no deben publicarse en el mismo catálogo visible para integradores tenant salvo necesidad explícita.

## Rollback y continuidad

Antes de cada fase se debe definir:

```text
cómo regresar al tenant inicial
cómo revertir tokens tenant-aware
cómo desactivar resolución por dominio
cómo restaurar bases
cómo conservar sesiones o revocarlas
cómo procesar outbox pendiente
cómo cerrar pagos o CFDI en curso
```

No se declara una fase terminada si su rollback depende de pasos manuales no documentados.

## Gate global antes de ofrecer el primer cliente SaaS

- Aislamiento probado entre al menos dos tenants.
- Backup y restore individual verificados.
- Branding cargado antes del login.
- Tokens ligados a tenant y dominio.
- Refresh tokens protegidos con cookie segura.
- Todas las premium bloqueadas en backend y reflejadas en frontend.
- Suspensión no elimina ni corrompe datos.
- FiscalAPI y Mercado Pago resueltos por tenant.
- Webhooks no pueden cruzar tenants.
- Panel de plataforma separado y protegido con MFA.
- Acciones de operadores auditadas.
- Aprovisionamiento y migraciones repetibles.
- Monitoreo y alertas por tenant/despliegue.
- Política comercial de downgrade, cancelación y retención aprobada.
- Términos, privacidad y responsabilidades operativas revisados.
- Pruebas unitarias, integración, seguridad, E2E, migración y recuperación aprobadas.

## Fuera de alcance de este orquestador

Salvo autorización futura, no implementar:

```text
rutas de reparto
camiones
choferes
GPS
almacenes móviles
microservicios por módulo
forks permanentes por cliente
marketplace de terceros
cobro automático con un proveedor específico
venta o transferencia del código fuente
eliminación automática por falta de pago
```

## Prompt maestro para iniciar una fase

```text
Eres un agente senior responsable de una fase de la evolución SaaS de Distribuidora. Antes de modificar código, lee 00_ORQUESTADOR.md, 10_ORQUESTADOR_SAAS_MULTITENANT_PREMIUM.md, los orquestadores de logs y frontend, las skills obligatorias y los ADR aprobados. Mantén una sola base de código tenant-aware, usa una base PostgreSQL por cliente y un PlatformDb separado. No confíes en TenantId enviado libremente por el cliente. Separa TenantStatus, Entitlement y Permission. Solo las feature keys premium definidas pueden activarse por licencia; seguridad, integridad, auditoría mínima y exportación de datos propios no son premium. No borres historia al desactivar funciones. Implementa un slice pequeño, migrable, reversible, probado contra acceso cruzado y documentado con el contrato de salida obligatorio. No avances a fases posteriores ni integres cobros reales sin autorización explícita.
```

## Checklist del orquestador

```text
[ ] Fase y alcance autorizados
[ ] ADRs aprobados
[ ] Modelo de amenazas actualizado
[ ] Tenant resolution definido
[ ] Impacto en PlatformDb y TenantDb revisado
[ ] Feature keys y límites identificados
[ ] Downgrade y suspensión definidos
[ ] Migración y rollback documentados
[ ] Secretos y credenciales protegidos
[ ] Pruebas de aislamiento incluidas
[ ] Pruebas premium incluidas
[ ] Backend y frontend alineados por OpenAPI
[ ] Observabilidad tenant-aware
[ ] Build, test, lint y migraciones aprobados
[ ] Evidencia de backup/restore cuando aplique
[ ] Sin conceptos de reparto fuera de alcance
```
