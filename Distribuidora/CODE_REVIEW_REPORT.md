# Revisión técnica del API

Fecha: 2026-08-09

## 1. Resumen ejecutivo

La solución tiene una base funcional consistente: separación por proyectos, controllers MVC protegidos por permisos, transacciones explícitas para operaciones críticas, concurrencia optimista y trazabilidad mediante auditoría/outbox. La deuda técnica es media, principalmente por acceso síncrono a EF Core, servicios de aplicación amplios en lugar de slices y cobertura parcial de validadores.

La revisión corrigió un defecto alto de integridad de inventario, activó la validación FluentValidation que estaba definida pero no conectada, endureció contraseñas/JWT, eliminó una credencial semilla predecible y actualizó dependencias con vulnerabilidades altas. No quedan paquetes vulnerables reportados por NuGet.

## 2. Problemas encontrados

### [Alta, corregida] Cancelación de ajuste no revertía inventario

**Ubicación:** `InventoryService.CancelAdjustmentAsync`.

**Problema:** un ajuste confirmado pasaba a `Cancelled` sin restaurar el balance ni generar kardex inverso.

**Impacto:** descuadre permanente entre documento, `StockBalance` y `InventoryMovement`.

**Solución aplicada:** cancelación atómica, consulta de movimientos originales, movimientos inversos `AdjustmentCancellation`, actualización del balance, auditoría y evento de dominio.

### [Alta, corregida] Dependencias con vulnerabilidades conocidas

**Ubicación:** `Directory.Packages.props`.

**Problema:** EF Core, Npgsql, System.Text.Json y dependencias de pruebas resolvían versiones con avisos altos.

**Solución aplicada:** parches compatibles de .NET 8/Npgsql y actualización de herramientas de prueba. La verificación final de NuGet reporta cero paquetes vulnerables.

### [Alta, corregida] Contraseña administrativa predecible en archivo de ejemplo

**Ubicación:** `.env.example`, `DatabaseSeeder`.

**Problema:** el ejemplo incluía una contraseña concreta que el seeder aceptaba.

**Impacto:** un despliegue basado en el ejemplo podía conservar credenciales conocidas.

**Solución aplicada:** marcador explícito y rechazo del marcador/default al iniciar. Si la contraseña anterior se utilizó, debe rotarse.

### [Media, corregida] FluentValidation no se ejecutaba

**Ubicación:** `RequestValidators.cs`, registro de Application y pipeline MVC.

**Problema:** existían validadores, pero no estaban registrados ni invocados.

**Impacto:** entradas inválidas podían llegar a servicios y producir errores inconsistentes o excepciones por null.

**Solución aplicada:** filtro global asíncrono, registro DI y contrato `400` uniforme. Se reforzaron login, refresh, productos, ventas y recepciones.

### [Media, pendiente] Acceso síncrono a EF Core

**Ubicación:** la mayoría de consultas en `Distribuidora.Application` y actions GET.

**Problema:** se usan terminales LINQ síncronos (`ToArray`, `SingleOrDefault`, `Any`, `Sum`) sobre `IQueryable`.

**Impacto:** bloqueo de threads y menor capacidad bajo carga; los GET tampoco propagan `CancellationToken`.

**Solución recomendada:** migrar por vertical slice a métodos async de EF Core y proyectar DTOs sin tracking. Requiere ampliar la abstracción de persistencia sin filtrar EF hacia Application.

### [Media, pendiente] Arquitectura por servicios amplios

**Ubicación:** `SalesService`, `PurchaseService`, `InventoryService`, `PointPaymentService`.

**Problema:** varios casos de uso viven en servicios por módulo en vez de commands/queries/handlers independientes.

**Impacto:** clases crecientes, pruebas menos aisladas y mayor superficie de cambio.

**Solución recomendada:** migración incremental por caso de uso; no reescribir todo en un único cambio.

### [Media, pendiente] Cobertura parcial de validación declarativa

**Ubicación:** `Distribuidora.Contracts/Requests` y `RequestValidators.cs`.

**Problema:** el pipeline ya funciona, pero solo los requests críticos existentes tienen validador; el resto depende de validaciones imperativas.

**Solución recomendada:** agregar validadores por slice, empezando por identidad, inventario, cobranza y facturación electrónica.

## 3. Código duplicado / DRY

- Persisten patrones repetidos de consulta, mapeo y respuesta en controllers y servicios.
- No se introdujo un repositorio genérico ni una jerarquía de controllers: ocultarían diferencias de negocio.
- Se centralizó únicamente la validación transversal, donde sí existía repetición y una responsabilidad clara.

## 4. Vulnerabilidades de seguridad

| Severidad | Vulnerabilidad | Estado | Solución |
|---|---|---|---|
| Alta | Paquetes transitivos vulnerables | Corregida | Parches compatibles y auditoría NuGet limpia |
| Alta | Credencial semilla predecible | Corregida | Marcador rechazado y rotación requerida si se usó |
| Media | Hash PBKDF2 malformado podía lanzar/error o forzar parámetros no confiables | Corregida | Validación estricta de algoritmo, iteraciones y tamaños |
| Media | Clave JWT corta aceptada al arrancar | Corregida | Mínimo de 32 bytes |
| Media | Validación de entrada no conectada | Corregida parcialmente | Pipeline global y validadores críticos |
| Baja | Swagger/Scalar disponibles fuera de Development | Pendiente | Restringir por configuración o política si el entorno lo requiere |

## 5. Números y strings mágicos

| Valor | Ubicación | Recomendación/estado |
|---|---|---|
| `120_000`, `16`, `32` | `PasswordService` | Convertidos en constantes con nombre |
| `5` y `3` | código postal y régimen fiscal | Centralizados en `FiscalDataRules` y reutilizados por dominio, aplicación y configuración EF |
| `32` bytes JWT | `Program.cs` | Centralizado en `AuthenticationDefaults` como regla explícita de seguridad |
| `5` intentos/minuto | rate limiter de autenticación | Centralizado en `AuthenticationDefaults`; puede migrarse a Options si debe variar por entorno |
| `30` minutos / `7` días | tokens | Centralizados en `AuthenticationDefaults`; pueden migrarse a `JwtOptions` si deben variar por entorno |
| `20` segundos | cliente Mercado Pago | Convertido en constante con nombre; puede migrarse a Options si requiere ajuste operativo |
| `30`, `60`, `90`, `366` | crédito y reportes | Centralizados según su regla de negocio |
| `10`, `50`, `10`, `8` | procesamiento del outbox | Centralizados como intervalo, lote, reintentos y exponente máximo |
| `Administrator`, permisos y claim | identidad/autorización/seeder | Centralizados en `Application.Security`; eliminada la lista duplicada del seeder |
| folios y medios de pago | compras, inventario, ventas y seeder | Centralizados en constantes de dominio compartidas |
| estados de eventos y proveedor de pagos | outbox y Mercado Pago | Centralizados para evitar comparaciones de strings dispersas |

Los límites exclusivos de una propiedad dentro de la configuración EF (`HasMaxLength`) se mantienen como metadatos declarativos del esquema. No se convirtieron mecánicamente en constantes porque el prompt exige evaluar significado y ciclo de vida antes de hacerlo. Los límites compartidos entre capas sí se centralizaron.

## 6. Problemas de legibilidad y formato

Se ejecutó `dotnet format`. Se expandieron inicializadores densos y diccionarios compactos en los archivos que el formateador identificó. No se reformatearon migraciones generadas sin necesidad.

## 7. Problemas de mantenibilidad

- Servicios de aplicación de hasta 257 líneas y múltiples casos de uso.
- Configuraciones EF agrupadas en un archivo grande.
- Consultas y mapeos repetidos.
- El nombre `IDatatimeProvider` contiene un error tipográfico; renombrarlo sería un cambio transversal y se dejó pendiente.

## 8. Problemas de rendimiento

El problema relevante es el I/O síncrono de EF Core. También hay consultas por elemento en algunos flujos de ventas e inventario; conviene precargar productos/balances por lote. No se aplicaron micro-optimizaciones.

## 9. Problemas arquitectónicos

Los controllers permanecen delgados y no acceden a `DbContext`. No hay Minimal APIs. La principal desviación es la organización por servicios de feature en lugar de Vertical Slice completo.

## 10. Refactorización propuesta

Los cambios implementados están en los archivos del diff. La siguiente fase recomendada es migrar un módulo a la vez a handlers async con proyecciones y validadores completos, comenzando por Inventory y Sales.

## 11. Qué cambió

- Reversión transaccional de ajustes confirmados.
- Nuevo tipo de movimiento y evento de cancelación.
- Pipeline global de FluentValidation.
- Validaciones de entrada críticas.
- Validación robusta de hashes PBKDF2 y longitud JWT.
- Eliminación de credencial semilla predecible.
- Dependencias vulnerables actualizadas.
- Formato oficial aplicado.
- Pruebas de regresión y de integración agregadas.

## 12. Código final

El código final está aplicado directamente en la solución; no se duplica completo en este informe para evitar que la documentación quede desactualizada.

## 13. Comparativa antes vs después

| Aspecto | Antes | Después |
|---|---|---|
| Legibilidad | Bloques densos puntuales | Formato consistente en archivos afectados |
| Complejidad | Cancelación incompleta | Flujo transaccional explícito |
| Seguridad | Paquetes/seed/JWT/hash con riesgos | Riesgos corregidos y NuGet limpio |
| DRY | Validación desconectada y dispersa | Pipeline transversal reutilizable |
| Mantenibilidad | Media | Media, con defectos críticos eliminados |
| Testabilidad | Sin regresión del ajuste | Regresión de inventario y seguridad cubierta |
| Rendimiento | I/O EF síncrono | Pendiente de migración incremental |
| Arquitectura | Clean Architecture parcial | Límites preservados; Vertical Slice pendiente |

## 14. Prioridad de cambios

### Corregir inmediatamente

- Rotar la antigua contraseña del ejemplo si se utilizó en cualquier ambiente.

### Alta prioridad

- Migrar consultas EF críticas a async y agregar pruebas PostgreSQL/Testcontainers para concurrencia real.
- Completar validadores para operaciones monetarias, inventario e identidad.

### Mejora recomendada

- Separar servicios grandes por vertical slice.
- Agregar paginación a listados operativos no acotados.
- Configurar Swagger/Scalar según ambiente.

### Opcional

- Renombrar `IDatatimeProvider` a `IDateTimeProvider` en un cambio transversal controlado.

## Verificación

- `dotnet format`: ejecutado.
- `dotnet test Distribuidora.slnx --no-restore`: 38 unitarias + 7 integración, todas pasan.
- `dotnet list <proyecto> package --vulnerable --include-transitive`: cero paquetes vulnerables en los siete proyectos.
- Migraciones: no se requirió migración; el enum se almacena como entero y el nuevo valor se agregó al final para preservar valores existentes.
