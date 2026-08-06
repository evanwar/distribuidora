---
project: Distribuidora - Facturacion posterior de venta de mostrador
stack_backend: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
stack_frontend: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, Vitest, Playwright
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events + Feature-First UI
scope: Backend y frontend, venta confirmada sin cliente que posteriormente requiere CFDI nominativo
fiscal_scope: Mexico, CFDI 4.0, operaciones con publico en general y factura global
last_fiscal_review: 2026-08-04
---

# 10 - Orquestador del cambio: facturacion posterior de una venta sin cliente

## Proposito

Orquestar un cambio seguro para que una venta de mostrador registrada como `Venta al publico`, y posteriormente solicitada para facturacion por el comprador, pueda asociarse a un receptor fiscal y emitir su CFDI nominativo sin alterar la operacion comercial confirmada, el inventario, los pagos, la cartera ni los importes historicos.

Este documento complementa y no reemplaza:

- `00_ORQUESTADOR.md` del backend.
- `frontend_agent_prompts_mostrador_angular_responsive_material/00_ORQUESTADOR.md` del frontend.
- Las skills, convenciones, matrices, workflows y gates obligatorios declarados por ambos orquestadores.

Ante contradiccion, prevalecen la legislacion fiscal vigente, el contrato OpenAPI aprobado y las reglas de inmutabilidad, seguridad y auditoria de los orquestadores base.

## Resultado esperado

El historial de ventas debe permitir el siguiente flujo:

```text
venta confirmada sin cliente
  -> solicitar factura
  -> evaluar elegibilidad fiscal en backend
  -> seleccionar o registrar cliente
  -> completar y validar perfil fiscal CFDI 4.0
  -> asociar receptor fiscal a la venta con motivo y auditoria
  -> resolver cobertura en factura global, si aplica
  -> revisar datos fiscales y conceptos
  -> emitir CFDI nominativo una sola vez
  -> mostrar UUID/estado y permitir descargar XML/PDF
```

La venta debe seguir mostrando que originalmente fue realizada a publico en general. La asociacion posterior se muestra como `Receptor fiscal`, no como una reescritura silenciosa del cliente original.

## Decision arquitectonica obligatoria

No modificar `CounterSale.CustomerId` en una venta confirmada para resolver este caso.

`CounterSale.CustomerId` conserva el contexto comercial existente: cliente seleccionado durante la venta, reglas de credito y cuenta por cobrar. La facturacion posterior debe usar una asociacion fiscal separada, por ejemplo `SaleBillingRecipient`, vinculada a la venta y al cliente.

Esta separacion impide que una accion fiscal posterior:

- cambie historicamente una venta a publico en general;
- cree o reasigne cuentas por cobrar;
- altere limites o saldos de credito;
- cambie reportes comerciales sin trazabilidad;
- modifique inventario, pagos, totales, descuentos, impuestos o fechas de venta.

El nombre definitivo de la entidad puede ajustarse al lenguaje ubicuo del proyecto, pero no se permite reutilizar la edicion general de venta ni `UpdateDraftCounterSale` para una venta confirmada.

## Marco fiscal minimo que debe respetarse

La implementacion debe validarse nuevamente antes de salir a produccion contra las disposiciones vigentes y con el responsable fiscal/contable de la empresa. Este documento define controles de software; no sustituye asesoria fiscal.

### CFDI nominativo 4.0

El backend debe exigir y validar, como minimo:

- RFC del receptor.
- Nombre, denominacion o razon social.
- Codigo postal del domicilio fiscal.
- Regimen fiscal del receptor.
- Uso de CFDI compatible con el regimen fiscal.
- Forma de pago y metodo de pago conforme al estado real de cobro.
- Claves SAT, unidad, objeto de impuesto e impuestos de cada concepto.
- Lugar y fecha de expedicion configurados por el emisor.

El correo es opcional y no sustituye ningun dato fiscal obligatorio. El sistema no debe exigir al comprador la Constancia de Situacion Fiscal como condicion tecnica para facturar; debe solicitar los datos requeridos y permitir su validacion.

### Operaciones con publico en general

Las ventas sin CFDI nominativo pueden formar parte del CFDI global del periodo conforme a la politica fiscal configurada por la empresa. Cada venta debe tener cobertura fiscal identificable y no puede quedar simultaneamente en un CFDI global vigente y en un CFDI nominativo vigente.

### Venta todavia no incluida en un CFDI global emitido

Se debe excluir o reservar la venta para facturacion nominativa antes de emitir el CFDI global. Despues puede emitirse el CFDI al receptor seleccionado.

### Venta incluida en un CFDI global ya emitido

No se permite timbrar directamente el CFDI nominativo. El flujo debe:

1. identificar el CFDI global vigente que contiene la operacion;
2. solicitar su cancelacion con motivo SAT `04`, operacion nominativa relacionada en una factura global;
3. confirmar el estado real de cancelacion con PAC/SAT;
4. emitir nuevamente el CFDI global sin la operacion solicitada;
5. emitir el CFDI nominativo del cliente;
6. conservar UUID, relaciones, solicitudes, respuestas, estados, usuario, fecha y `correlationId` de cada paso.

La venta comercial no se cancela porque la operacion si ocurrio. Lo que se corrige es su cobertura fiscal.

Si el sistema no administra ni puede consultar la factura global real, debe devolver un bloqueo operativo y enviar el caso a conciliacion fiscal. No debe asumir `notIncluded` ni permitir el timbrado basandose solo en la fecha.

## Fuentes oficiales de referencia

Los agentes deben consultar la version vigente al momento de implementar y documentar la fecha de revision:

- [Articulo 29-A del Codigo Fiscal de la Federacion](https://wwwmat.sat.gob.mx/articulo/99662/articulo-29-a)
- [Anexo 20 y formato de CFDI vigente](https://wwwmatnp.sat.gob.mx/consultas/35025/formato-de-factura-electronica-%28anexo-20%29)
- [Datos del receptor para CFDI 4.0](https://www.sat.gob.mx/minisitio/Factura/documentos/Infografia_FacturaElectronica_Datos_Receptor.pdf)
- [Expedicion de comprobantes en operaciones con el publico en general](https://wwwmatnp.sat.gob.mx/articulo/90959/regla-2.7.1.24)
- [Esquema y motivos de cancelacion de CFDI](https://wwwmatnp.sat.gob.mx/consultas/91447/nuevo-esquema-de-cancelacion)
- [Preguntas frecuentes de cancelacion, incluido el escenario de factura global](https://www.sat.gob.mx/cs/Satellite?blobcol=urldata&blobkey=id&blobtable=MungoBlobs&blobwhere=1461176211410&ssbinary=true)
- [Resolucion Miscelanea Fiscal 2026 publicada por el SAT](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/rmf/RMF_2026-DOF-28122025.pdf)

No hardcodear en el dominio numeros de regla, plazos o catalogos SAT que puedan cambiar. Versionarlos/configurarlos cuando corresponda y registrar la fuente y fecha de actualizacion.

## Alcance funcional

### Incluido

- Consultar la elegibilidad fiscal de una venta confirmada.
- Seleccionar un cliente existente o registrarlo mediante el modulo propietario de clientes.
- Completar y validar el perfil fiscal del cliente.
- Asociar un receptor fiscal a una venta confirmada originalmente sin cliente.
- Cambiar el receptor fiscal antes del timbrado mediante una nueva accion auditada, si la politica lo permite.
- Guardar una instantanea inmutable de los datos fiscales usados para cada intento de emision.
- Bloquear duplicidad entre CFDI global y nominativo.
- Emitir, consultar, descargar y cancelar CFDI mediante el proveedor configurado.
- Resolver o escalar el escenario de una operacion ya incluida en factura global.
- Mostrar estados claros, errores recuperables y trazabilidad de la operacion.
- Agregar permisos, auditoria, concurrencia, migraciones, OpenAPI y pruebas.

### Fuera de alcance

- Editar productos, cantidades, precios, descuentos, impuestos, pagos o almacen de una venta confirmada.
- Convertir retroactivamente una venta de contado en credito o mixta.
- Crear o reasignar cuentas por cobrar por asociar un receptor fiscal.
- Cancelar la venta comercial para emitir una factura.
- Permitir dos CFDI nominativos vigentes para la misma venta.
- Permitir cobertura simultanea en CFDI global vigente y CFDI nominativo vigente.
- Implementar contabilidad general, polizas contables o declaraciones fiscales.
- Incorporar rutas, camiones, reparto, GPS o cualquier concepto excluido por los orquestadores base.

## Modelo de dominio minimo

El agente de backend debe proponer nombres finales consistentes, pero cubrir estas responsabilidades.

### `CustomerFiscalProfile`

Perfil fiscal reutilizable del cliente:

```text
CustomerId
TaxId
LegalName
FiscalZipCode
TaxRegimeCode
DefaultCfdiUseCode optional
InvoiceEmail optional
ValidatedAt optional
ValidatedBy optional
RowVersion
campos auditables
```

Normalizar RFC y nombre conforme al contrato del PAC/SAT sin destruir el valor original antes de validarlo. Aplicar unicidad y reglas de longitud compatibles con CFDI 4.0. No asumir que `Customer.Name`, `Address` o `TaxId` actuales forman por si solos un perfil fiscal completo.

### `SaleBillingRecipient`

Asociacion fiscal posterior, uno a uno con la venta mientras no exista una politica explicita de historial de reemplazos:

```text
SaleId unique
CustomerId
Status: Assigned | Replaced | Locked | Cancelled
Reason
AssignedAt
AssignedBy
ReplacedAt optional
ReplacedBy optional
RowVersion
campos auditables
```

Cada reemplazo debe conservar before/after en auditoria. Una vez creado un intento de CFDI, el receptor queda bloqueado para ese intento; cualquier correccion sigue el flujo de cancelacion/sustitucion fiscal correspondiente.

### Instantanea fiscal del CFDI

`ElectronicInvoice` o una entidad dependiente debe conservar los valores exactos enviados al PAC:

```text
RecipientTaxId
RecipientLegalName
RecipientFiscalZipCode
RecipientTaxRegimeCode
CfdiUseCode
PaymentFormCode
PaymentMethodCode
CurrencyCode
ExpeditionZipCode
fiscal metadata por concepto
provider request/reference segura
provider response/reference segura
```

No guardar secretos, API keys ni datos innecesarios del proveedor. Los cambios posteriores al cliente no deben modificar un CFDI ya solicitado o emitido.

### Cobertura fiscal y factura global

Debe existir una fuente de verdad consultable que permita distinguir al menos:

```text
Uncovered
ReservedForNominativeInvoice
IncludedInOpenGlobalInvoice
IncludedInIssuedGlobalInvoice
GlobalInvoiceCancellationPending
GlobalInvoiceCancelled
NominativeInvoicePending
NominativeInvoiceIssued
ReconciliationRequired
```

Si la factura global se implementa dentro del sistema, modelar su encabezado, periodo, UUID, estado y relacion explicita con las ventas incluidas. Si se administra externamente, crear un mecanismo de importacion/conciliacion verificable; un campo manual sin evidencia no es suficiente para habilitar el timbrado.

## Invariantes de negocio

1. Solo una venta `Confirmed`, no cancelada, puede solicitar CFDI.
2. La venta debe tener `CustomerId` original nulo para usar este flujo; las ventas con cliente usan el flujo fiscal normal.
3. El cliente y su perfil fiscal deben estar activos y completos.
4. Asociar receptor fiscal no modifica la venta ni genera movimientos de inventario o dinero.
5. No se permite asociar receptor si ya existe CFDI nominativo emitido.
6. No se permite emitir mientras haya un intento de PAC indeterminado, pendiente o en conciliacion.
7. No se permite emitir si la operacion pertenece a un CFDI global vigente.
8. Solo se excluye de la factura global despues de completar el flujo fiscal autorizado.
9. Un fallo o timeout del PAC nunca dispara reintento automatico de emision o cancelacion.
10. La idempotencia se define por venta y tipo de operacion fiscal, no por una clave nueva generada en cada click.
11. La respuesta del PAC/SAT es autoritativa para UUID y estado fiscal.
12. La forma y metodo de pago se derivan del estado real de la venta; no se aceptan combinaciones arbitrarias del frontend.
13. Los conceptos, cantidades, precios, descuentos e impuestos se toman de la venta confirmada y su configuracion fiscal versionada.
14. Todo cambio de receptor, reserva fiscal, emision, cancelacion, sustitucion o conciliacion genera auditoria.
15. Las transiciones concurrentes se protegen con `RowVersion` y restricciones/indices unicos.

## Casos de uso backend

Implementar como vertical slices separados:

```text
GetSaleBillingEligibility
AssignSaleBillingRecipient
ReplaceSaleBillingRecipientBeforeInvoice
GetSaleFiscalStatus
IssueNominativeElectronicInvoice
ReconcileElectronicInvoiceAttempt
ReserveSaleForNominativeInvoice
RemoveSaleFromOpenGlobalInvoice
ReplaceIssuedGlobalInvoiceForNominativeSale
```

Los ultimos tres slices solo pueden marcarse completos cuando exista una implementacion real de factura global o una integracion externa verificable.

### Contrato API propuesto

El agente de contrato debe validar nombres y DTOs contra el estilo vigente, actualizar OpenAPI y asignar IDs nuevos en la matriz frontend. Contrato base:

```text
GET /api/v1/counter-sales/{id}/billing-eligibility
PUT /api/v1/counter-sales/{id}/billing-recipient
GET /api/v1/counter-sales/{id}/fiscal-status
```

Ejemplo de asociacion:

```json
{
  "customerId": "00000000-0000-0000-0000-000000000000",
  "reason": "El comprador regreso con sus datos para solicitar CFDI",
  "rowVersion": "..."
}
```

La respuesta de elegibilidad debe ser autoritativa y util para UI:

```json
{
  "eligible": false,
  "reasonCode": "included_in_issued_global_invoice",
  "requiredAction": "replace_global_invoice",
  "saleId": "...",
  "saleStatus": "Confirmed",
  "billingCustomerId": null,
  "fiscalCoverageStatus": "IncludedInIssuedGlobalInvoice",
  "electronicInvoiceStatus": null,
  "rowVersion": "..."
}
```

No confiar en valores fiscales, estados, permisos, totales o identificadores de factura global enviados por el frontend. El endpoint de emision debe obtener el receptor desde la asociacion aprobada y guardar la instantanea efectiva; si conserva datos de receptor en el request por compatibilidad, debe compararlos con la fuente de verdad y rechazar discrepancias.

### Codigos HTTP minimos

```text
200/201 operacion completada
400 request mal formado
401 no autenticado
403 sin permiso
404 venta, cliente o perfil no encontrado
409 conflicto de estado, concurrencia, cobertura global o intento fiscal existente
422 datos fiscales incompatibles o incompletos
502/503 proveedor fiscal no disponible, con intento persistido y conciliacion requerida cuando aplique
```

Los errores deben incluir `reasonCode` estable y `correlationId`; no exponer mensajes internos ni respuestas sensibles del PAC.

## Seguridad y permisos

Agregar y sembrar permisos granulares:

```text
sales.view_billing_eligibility
sales.assign_billing_recipient
sales.replace_billing_recipient
sales.invoice
sales.reconcile_invoice
sales.manage_global_invoice_replacement
```

Reglas:

- Toda mutacion requiere JWT y permiso especifico.
- Reemplazar receptor, conciliar o sustituir factura global requiere rol administrativo/fiscal, no solo permiso de vendedor.
- El backend vuelve a verificar permisos y estado; ocultar botones en frontend no es seguridad.
- Auditar usuario, fecha, IP/cliente cuando la infraestructura lo permita, motivo, before/after, entidad, operacion y `correlationId`.
- No registrar RFC completo, XML, credenciales o payload fiscal sensible en logs generales. Aplicar redaccion y acceso restringido.

## Transacciones, proveedor e idempotencia

Las llamadas al PAC no deben envolverse en una transaccion de base de datos de larga duracion. Usar un flujo persistido tipo saga/state machine:

```text
validar y reservar localmente
  -> commit
  -> invocar PAC con idempotency key estable
  -> persistir resultado
  -> confirmar estado o marcar ReconciliationRequired
```

Requisitos:

- persistir el intento antes de llamar al PAC;
- usar clave de idempotencia estable;
- impedir doble envio desde UI y backend;
- no reintentar automaticamente cuando la respuesta sea indeterminada;
- consultar/conciliar en el proveedor antes de permitir otro intento;
- usar outbox solo para notificaciones o efectos posteriores, no para ocultar una transicion fiscal critica;
- proteger con indice unico la factura nominativa vigente por venta;
- definir recuperacion ante caida entre cada transicion.

## Plan de ejecucion obligatorio

### Fase 0 - Descubrimiento y decision fiscal

Responsable: agente arquitecto/contrato.

1. Leer ambos orquestadores y todas sus skills obligatorias.
2. Revisar implementacion, migraciones, tests, OpenAPI y proveedor fiscal actuales.
3. Confirmar con responsable fiscal la periodicidad de factura global y si se emite dentro o fuera del sistema.
4. Verificar catalogos SAT y capacidades reales del PAC en ambiente de pruebas.
5. Crear ADR para la separacion `cliente comercial` versus `receptor fiscal`.
6. Documentar gaps; no iniciar UI con contratos inventados.

Gate:

```text
[ ] fuente de verdad de factura global identificada
[ ] ADR aprobado
[ ] contratos y estados acordados
[ ] politica de conciliacion aprobada
[ ] fuentes SAT y fecha de revision documentadas
```

### Fase 1 - Dominio, persistencia y perfil fiscal

Responsable: agente backend M02/M05.

1. Completar el perfil fiscal del cliente.
2. Implementar asociacion fiscal separada de `CounterSale.CustomerId`.
3. Incorporar cobertura fiscal, instantaneas, concurrencia, indices y restricciones.
4. Crear migracion EF Core con nombre descriptivo, sin editar migraciones historicas.
5. Agregar pruebas de dominio y persistencia.

Gate:

```text
[ ] venta confirmada permanece inmutable
[ ] CustomerId comercial no cambia
[ ] perfil fiscal completo y validado
[ ] indices evitan duplicidad
[ ] migracion aplica y revierte en PostgreSQL de prueba
```

### Fase 2 - Casos de uso y API

Responsable: agente backend M05/facturacion.

1. Implementar elegibilidad y asociacion/reemplazo de receptor.
2. Adaptar emision para usar la asociacion e instantanea fiscal.
3. Implementar permisos, auditoria, idempotencia y errores estables.
4. Implementar o integrar la cobertura de factura global.
5. Documentar endpoints y ejemplos en Swagger.
6. Actualizar documentacion `Distribuidora/docs/frontend-api` y Postman desde la fuente aprobada.

Gate:

```text
[ ] no existe camino para doble cobertura fiscal
[ ] timeout del PAC conduce a conciliacion, no a reintento ciego
[ ] 409/422 distinguen conflictos y datos fiscales
[ ] auditoria contiene before/after y correlationId
[ ] OpenAPI refleja el contrato real
```

### Fase 3 - Sincronizacion del contrato frontend

Responsable: agente de contrato frontend.

1. Ejecutar `workflows/WF05_sincronizacion_openapi.md`.
2. Regenerar el cliente TypeScript sin editar archivos generados.
3. Agregar las nuevas operaciones a `06_MATRIZ_ENDPOINTS_FRONTEND.md` con ownership F05.
4. Crear adapters y mappers dentro de `counter-sales` y usar el contrato publico de `customers`.
5. Bloquear el avance si OpenAPI, docs y servidor difieren.

### Fase 4 - UX frontend

Responsable: agente feature F05.

Desde historial/detalle de venta:

```text
Factura
  -> backend evalua elegibilidad
  -> si falta cliente: Seleccionar receptor fiscal
  -> buscar cliente o abrir alta mediante el feature propietario
  -> completar datos fiscales faltantes
  -> mostrar resumen de venta + receptor + cobertura fiscal
  -> confirmar asociacion con motivo
  -> emitir CFDI solo cuando backend lo autorice
```

Estados UX obligatorios:

- Elegible para factura nominativa.
- Perfil fiscal incompleto.
- Venta incluida en factura global abierta: excluir/reservar mediante accion autorizada.
- Venta incluida en factura global emitida: requiere proceso fiscal administrativo.
- Cancelacion de factura global pendiente.
- Intento de timbrado pendiente o indeterminado: requiere conciliacion.
- CFDI emitido: UUID y descargas.
- Prohibido por permisos.
- Conflicto de concurrencia: recargar estado real.

La UI no debe prometer que basta con `agregar cliente`. Debe explicar el impacto fiscal y mostrar el siguiente paso autoritativo. En movil, el flujo largo sera pagina o dialogo fullscreen; no encadenar dialogos estrechos.

Accesibilidad y seguridad UX:

- foco inicial y retorno de foco predecibles;
- labels y errores asociados a controles;
- confirmacion explicita antes de reservar, sustituir o timbrar;
- prevenir doble click y navegacion accidental durante mutaciones;
- mostrar `correlationId` en fallos operativos;
- no almacenar datos fiscales sensibles en `localStorage`;
- no reconstruir estados fiscales desde valores locales.

### Fase 5 - Factura global y conciliacion

Responsable: agente backend fiscal + agente frontend administrativo.

Esta fase es obligatoria antes de habilitar el flujo cuando una venta pueda estar incluida en un CFDI global emitido.

1. Implementar o integrar consulta de factura global y sus ventas.
2. Implementar cancelacion motivo `04` mediante el proveedor.
3. Esperar/verificar estado real; no asumir cancelacion inmediata.
4. Regenerar la factura global sin la venta nominativa.
5. Emitir el CFDI nominativo.
6. Crear bandeja de conciliacion y recuperacion para transiciones incompletas.
7. Probar fallos despues de cada llamada remota.

### Fase 6 - QA, seguridad y salida controlada

Responsable: agente QA/a11y/security.

1. Ejecutar pruebas unitarias, integracion, contrato y E2E.
2. Verificar responsive a 320 px, tableta y escritorio.
3. Validar permisos, auditoria, redaccion de logs e idempotencia.
4. Probar contra sandbox del PAC con escenarios aprobados.
5. Ejecutar ambos gates de orquestador, build backend y frontend.
6. Habilitar mediante feature flag inicialmente.
7. Monitorear errores, conciliaciones y duplicidad durante despliegue gradual.

## Pruebas minimas backend

- venta confirmada sin cliente puede asociar receptor fiscal elegible;
- la asociacion no cambia `CounterSale.CustomerId`;
- la asociacion no modifica pagos, inventario, cartera ni totales;
- venta en borrador, cancelada o inexistente es rechazada;
- cliente inactivo o perfil incompleto es rechazado;
- usuario sin permiso recibe `403`;
- segundo envio idempotente no crea otra asociacion ni otro CFDI;
- reemplazo antes del timbrado conserva auditoria before/after;
- reemplazo despues de crear intento fiscal es rechazado;
- una venta incluida en factura global vigente no puede timbrarse directamente;
- factura global abierta excluye/reserva la venta una sola vez;
- factura global emitida exige motivo `04` y confirmacion del PAC;
- timeout al emitir/cancelar marca conciliacion y bloquea reintento automatico;
- snapshot fiscal no cambia al editar posteriormente el cliente;
- indice unico impide dos CFDI vigentes para una venta;
- concurrencia obsoleta produce `409`;
- logs no contienen API keys ni payload fiscal sensible.

## Pruebas minimas frontend

- historial ofrece factura a venta confirmada sin cliente cuando el permiso existe;
- elegibilidad se consulta al abrir el flujo y antes de timbrar;
- selector permite buscar y registrar cliente sin duplicar el modulo de clientes;
- perfil fiscal incompleto dirige a completar campos requeridos;
- formulario tipado valida RFC, nombre, CP, regimen y uso CFDI;
- UI distingue cliente original y receptor fiscal;
- doble click no duplica asociacion ni timbrado;
- `409`, `422`, `403`, error de red y estado indeterminado tienen mensajes distintos;
- venta en factura global emitida no muestra emision directa;
- conciliacion muestra estado real y `correlationId`;
- UUID y descargas provienen del backend;
- flujo completo funciona con teclado;
- E2E en movil, tableta y escritorio sin overflow global.

## Escenarios E2E fiscales obligatorios

### A. Venta no incluida en factura global

```text
crear y confirmar venta de contado sin cliente
-> seleccionar cliente con perfil fiscal valido
-> asociar receptor
-> emitir CFDI
-> verificar UUID y XML/PDF
-> comprobar que inventario, pago, total y CustomerId comercial no cambiaron
```

### B. Venta incluida en factura global abierta

```text
solicitar CFDI nominativo
-> reservar/excluir venta de la global abierta
-> emitir CFDI nominativo
-> verificar que la global no incluya la operacion
```

### C. Venta incluida en factura global emitida

```text
solicitar CFDI nominativo
-> bloquear emision directa
-> cancelar global con motivo 04
-> confirmar cancelacion
-> regenerar global sin la venta
-> emitir CFDI nominativo
-> verificar trazabilidad de UUID y estados
```

### D. Respuesta indeterminada del PAC

```text
enviar emision
-> simular timeout despues de recepcion remota
-> marcar ReconciliationRequired
-> bloquear segundo timbrado
-> conciliar por idempotency key/identificador del proveedor
-> adoptar el estado real sin duplicar CFDI
```

## Migracion y compatibilidad

- No actualizar retroactivamente ventas confirmadas asignando `CustomerId`.
- Ventas historicas sin evidencia de cobertura global deben iniciar como `ReconciliationRequired` o estado equivalente, no como elegibles por defecto.
- La migracion debe ser aditiva y desplegable antes del frontend.
- Mantener compatibilidad del endpoint de emision solo si no debilita la fuente de verdad; documentar cualquier breaking change y regenerar clientes.
- Crear indices para `SaleId`, `CustomerId`, estados fiscales, UUID, idempotency key y relaciones de factura global.
- Definir rollback tecnico sin borrar evidencia fiscal ya creada.

## Observabilidad y operacion

Medir al menos:

```text
solicitudes de facturacion posterior
asociaciones exitosas/rechazadas por reasonCode
intentos de emision por estado
timeouts y conciliaciones pendientes
ventas bloqueadas por factura global
cancelaciones motivo 04
posibles duplicidades detectadas
latencia del PAC sin datos sensibles
```

Crear alertas para conciliaciones pendientes, fallos repetidos del proveedor y cualquier violacion de unicidad/cobertura. La interfaz administrativa debe permitir encontrar el caso por folio de venta, UUID, identificador del proveedor o `correlationId`.

## Gate final de aceptacion

No declarar el cambio terminado hasta cumplir todo lo siguiente:

```text
[ ] ambos orquestadores y skills fueron aplicados
[ ] responsable fiscal valido el flujo vigente
[ ] CustomerId comercial de ventas confirmadas permanece inmutable
[ ] receptor fiscal posterior tiene entidad, permiso y auditoria propios
[ ] datos CFDI 4.0 se validan y quedan en snapshot
[ ] cobertura global y nominativa es mutuamente excluyente
[ ] escenario de factura global emitida usa motivo 04
[ ] no hay reintentos automaticos de mutaciones fiscales indeterminadas
[ ] idempotencia, concurrencia e indices unicos fueron probados
[ ] Swagger/OpenAPI, docs, Postman y matriz frontend estan sincronizados
[ ] dotnet build y dotnet test pasan
[ ] npm lint/test/build y E2E criticos pasan
[ ] UX validada a 320 px, tableta y escritorio
[ ] logs y auditoria no exponen secretos o datos fiscales innecesarios
[ ] migraciones aplican en PostgreSQL y existe estrategia de rollback
[ ] sandbox del PAC cubre emision, cancelacion, timeout y conciliacion
[ ] feature flag y monitoreo estan listos
```

## Contrato de entrega de cada agente

Cada agente debe reportar:

```md
## Resumen
Slice implementado y necesidad cubierta.

## Archivos creados/modificados
Lista agrupada por proyecto y feature.

## Reglas fiscales aplicadas
Fuente oficial, fecha de consulta, supuestos y validacion del responsable fiscal.

## Contratos
Endpoints, DTOs, permisos, codigos HTTP, reasonCodes y cambios OpenAPI.

## Persistencia y migraciones
Entidades, indices, restricciones, concurrencia y rollback.

## Auditoria e idempotencia
Eventos, before/after, correlationId, claves y recuperacion ante fallos.

## UX y accesibilidad
Estados, responsive, teclado, foco, errores y prevencion de doble envio.

## Pruebas y evidencia
Unitarias, integracion, contrato, E2E, build y sandbox del PAC.

## Riesgos / pendientes
Gaps fiscales, de proveedor, contrato o decisiones humanas.
```

## Prompt maestro para los agentes

```text
Implementa unicamente el slice asignado del flujo de facturacion posterior de una venta confirmada sin cliente. Antes de modificar codigo, lee 10_ORQUESTADOR_FACTURACION_POSTERIOR_VENTA_SIN_CLIENTE.md, el 00_ORQUESTADOR.md correspondiente, AGENTS.md cuando exista, todas las skills obligatorias y los documentos de modulo/contrato aplicables. Conserva inmutable la venta confirmada: no cambies CounterSale.CustomerId, inventario, pagos, cartera, importes ni fecha. Modela el receptor fiscal como una asociacion separada, autorizada y auditada. El backend es la fuente de verdad para elegibilidad, cobertura global, estados, datos historicos e idempotencia. No permitas timbrado directo si la operacion pertenece a un CFDI global vigente; para una global emitida aplica el flujo fiscal con motivo de cancelacion 04 y conciliacion real con el proveedor. No reintentes automaticamente emisiones o cancelaciones indeterminadas. Entrega codigo en ingles, migraciones, OpenAPI, pruebas, documentacion, evidencia de build y riesgos pendientes. No implementes rutas, camiones, reparto ni conceptos fuera del MVP de mostrador.
```
