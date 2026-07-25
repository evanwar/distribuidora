---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
priority: mandatory
---

# Skill - Controladores ASP.NET Core basados en `ControllerBase`

## Objetivo

Establecer el estándar obligatorio para exponer la API mediante **controladores MVC de ASP.NET Core**. Esta skill prohíbe el uso de Minimal APIs y asegura que los controladores sean delgados, consistentes, seguros, documentados y compatibles con Clean Architecture y Vertical Slice.

> Esta skill tiene precedencia sobre cualquier instrucción anterior que permita elegir entre Minimal APIs y Controllers.

---

## Decisión arquitectónica obligatoria

La API debe implementarse exclusivamente con:

```csharp
[ApiController]
public sealed class ProductsController : ControllerBase
{
}
```

No se permite definir endpoints mediante:

```csharp
app.MapGet(...);
app.MapPost(...);
app.MapPut(...);
app.MapDelete(...);
app.MapGroup(...);
RouteGroupBuilder;
IEndpointRouteBuilder;
```

Tampoco se permite encapsular Minimal APIs en métodos como:

```csharp
public static void MapProductsEndpoints(this IEndpointRouteBuilder app)
```

El archivo `Program.cs` solo debe configurar servicios, middlewares y el mapeo global de controladores:

```csharp
builder.Services.AddControllers();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

---

## Ubicación de los controladores

Los controladores pertenecen únicamente al proyecto de presentación:

```text
src/
  Distribuidora.Api/
    Controllers/
      V1/
        AuthController.cs
        ProductsController.cs
        CustomersController.cs
        InventoryController.cs
        PurchasesController.cs
        SalesController.cs
        AccountsReceivableController.cs
        ReportsController.cs
```

No deben existir controladores dentro de:

```text
Distribuidora.Domain
Distribuidora.Application
Distribuidora.Infrastructure
Distribuidora.Contracts
```

Los casos de uso continúan organizados por feature y vertical slice dentro de `Application`:

```text
Distribuidora.Application/
  Features/
    Products/
      CreateProduct/
        CreateProductCommand.cs
        CreateProductValidator.cs
        CreateProductHandler.cs
        CreateProductResult.cs
      GetProductById/
        GetProductByIdQuery.cs
        GetProductByIdHandler.cs
      SearchProducts/
        SearchProductsQuery.cs
        SearchProductsHandler.cs
```

El controlador es la puerta HTTP del slice, pero no contiene su lógica.

---

## Responsabilidad permitida del controlador

Un controlador puede únicamente:

1. Recibir datos desde ruta, query string, headers o body.
2. Convertir el contrato HTTP en un command o query de `Application`.
3. Obtener datos del usuario autenticado mediante una abstracción segura.
4. Enviar el command/query al dispatcher o mediator definido por la solución.
5. Devolver el código HTTP y contrato de respuesta correspondiente.
6. Declarar autorización, documentación OpenAPI y metadatos HTTP.

Ejemplo del flujo permitido:

```text
HTTP Request
   -> Controller
   -> Command / Query
   -> Application Handler
   -> Domain
   -> Infrastructure
   -> Result
   -> Controller
   -> HTTP Response
```

---

## Responsabilidades prohibidas

El controlador no debe:

- Inyectar ni usar directamente `AppDbContext`.
- Inyectar repositorios de infraestructura.
- Ejecutar consultas LINQ contra EF Core.
- Abrir, confirmar o revertir transacciones.
- Calcular existencias, subtotales, descuentos, impuestos, pagos o saldos.
- Cambiar el estado de agregados directamente.
- Publicar Domain Events directamente.
- Invocar `SaveChangesAsync`.
- Implementar reglas de negocio.
- Duplicar validaciones de `Application` o `Domain`.
- Atrapar excepciones generales en cada action.
- Devolver entidades EF Core o agregados de dominio.
- Confiar en `UserId`, permisos, costos o precios sensibles enviados por el cliente.
- Crear dependencias mediante `new` dentro de una action.
- Utilizar service locator mediante `HttpContext.RequestServices`.

Ejemplo prohibido:

```csharp
[HttpPost("{id:guid}/confirm")]
public async Task<IActionResult> Confirm(Guid id)
{
    var sale = await _dbContext.Sales
        .Include(x => x.Items)
        .FirstAsync(x => x.Id == id);

    foreach (var item in sale.Items)
    {
        var stock = await _dbContext.StockBalances
            .FirstAsync(x => x.ProductId == item.ProductId);

        stock.Quantity -= item.Quantity;
    }

    sale.Status = SaleStatus.Confirmed;
    await _dbContext.SaveChangesAsync();

    return Ok();
}
```

La operación anterior debe residir en un caso de uso de `Application`, apoyarse en reglas del `Domain` y ejecutarse transaccionalmente desde la infraestructura correspondiente.

---

## Clase base y atributos obligatorios

Cada controlador debe cumplir, como mínimo, con lo siguiente:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Mime;

namespace Distribuidora.Api.Controllers.V1;

[ApiController]
[Route("api/v1/products")]
[Authorize]
[Produces(MediaTypeNames.Application.Json)]
public sealed class ProductsController : ControllerBase
{
}
```

### Reglas

- Heredar de `ControllerBase`, no de `Controller`.
- Usar `[ApiController]`.
- Declarar rutas explícitas y estables.
- Usar nombres de recursos en plural.
- Mantener la versión dentro de la ruta mientras esa sea la convención global.
- Marcar el controlador como `sealed`, salvo que exista una razón documentada para herencia.
- Usar `[Authorize]` por defecto y `[AllowAnonymous]` únicamente en operaciones públicas justificadas, como login o refresh token.
- No colocar lógica en una clase base personalizada de controladores.

---

## Inyección de dependencias

Preferir una sola dependencia de despacho hacia `Application`:

```csharp
private readonly ISender _sender;

public ProductsController(ISender sender)
{
    _sender = sender;
}
```

`ISender` representa el mediator o dispatcher aprobado por la solución. Si el proyecto utiliza una abstracción propia, debe conservar el mismo principio: el controlador depende de `Application`, no de `Infrastructure`.

No mezclar en distintos controladores estos estilos sin una decisión global:

```text
MediatR ISender
Command bus propio
Servicios de aplicación por feature
Handlers inyectados directamente
```

Si el proyecto adopta MediatR, todos los módulos deben seguir la misma convención.

### Límite recomendado

Un controlador no debería necesitar más de una o dos dependencias. Un número mayor suele indicar que está coordinando lógica que pertenece a `Application`.

---

## Relación con Vertical Slice

Cada action debe corresponder claramente a un caso de uso.

| Action del controlador | Slice de Application |
|---|---|
| `Create` | `Features/Products/CreateProduct` |
| `GetById` | `Features/Products/GetProductById` |
| `Search` | `Features/Products/SearchProducts` |
| `Update` | `Features/Products/UpdateProduct` |
| `Deactivate` | `Features/Products/DeactivateProduct` |

No crear un servicio genérico con decenas de métodos para concentrar todas las operaciones del módulo.

No usar un controlador distinto por cada command/query. El controlador se agrupa por recurso HTTP; los slices se separan en `Application`.

---

## Contratos HTTP

Los requests y responses públicos deben residir en `Distribuidora.Contracts` o en la ubicación global definida para contratos externos.

Nunca recibir o devolver directamente:

```text
EF Core entities
Domain aggregates
Value objects internos sin contrato explícito
Commands o queries como contrato público de la API
```

Ejemplo:

```csharp
public sealed record CreateProductRequest(
    string Sku,
    string Name,
    Guid CategoryId,
    Guid UnitId,
    decimal Cost,
    decimal BasePrice,
    decimal MinimumStock);

public sealed record ProductResponse(
    Guid Id,
    string Sku,
    string Name,
    decimal BasePrice,
    bool IsActive);
```

El controller puede hacer un mapeo simple del request hacia el command:

```csharp
var command = new CreateProductCommand(
    request.Sku,
    request.Name,
    request.CategoryId,
    request.UnitId,
    request.Cost,
    request.BasePrice,
    request.MinimumStock);
```

Cuando el mapeo sea extenso, moverlo a un mapper explícito del boundary HTTP. No colocar reglas de negocio dentro del mapper.

---

## Binding explícito

Usar atributos de binding cuando mejoren claridad:

```csharp
[HttpGet("{id:guid}")]
public async Task<ActionResult<ApiResponse<ProductResponse>>> GetById(
    [FromRoute] Guid id,
    CancellationToken cancellationToken)
```

```csharp
[HttpGet]
public async Task<ActionResult<ApiResponse<PagedResponse<ProductListItemResponse>>>> Search(
    [FromQuery] SearchProductsRequest request,
    CancellationToken cancellationToken)
```

```csharp
[HttpPost]
public async Task<ActionResult<ApiResponse<ProductResponse>>> Create(
    [FromBody] CreateProductRequest request,
    CancellationToken cancellationToken)
```

Reglas:

- Un solo parámetro `[FromBody]` por action.
- Usar restricciones de ruta como `{id:guid}`.
- No recibir entidades completas para actualizar parcialmente.
- Evitar parámetros primitivos numerosos; encapsular filtros en request objects.
- Configurar límites globales para payloads y archivos cuando corresponda.

---

## Métodos HTTP y rutas

### Operaciones CRUD

```text
GET    /api/v1/products
GET    /api/v1/products/{id}
POST   /api/v1/products
PUT    /api/v1/products/{id}
```

### Transiciones de estado del dominio

Las operaciones de negocio explícitas pueden usar subrecursos o acciones claras:

```text
POST /api/v1/sales/{id}/confirm
POST /api/v1/sales/{id}/cancel
POST /api/v1/goods-receipts/{id}/close
POST /api/v1/inventory-adjustments/{id}/authorize
```

No forzar una transición importante dentro de un `PUT` genérico.

### Reglas de diseño

- Las rutas no deben contener verbos para consultas CRUD ordinarias.
- Las transiciones de estado sí pueden usar nombres de acción cuando representan commands del negocio.
- No usar rutas ambiguas como `/process`, `/execute`, `/save` o `/do-action`.
- Mantener nomenclatura consistente en todos los módulos.
- No exponer nombres internos de tablas o infraestructura.

---

## Respuestas HTTP

Usar `ActionResult<T>` cuando exista una respuesta tipada:

```csharp
public async Task<ActionResult<ApiResponse<ProductResponse>>> GetById(...)
```

Usar `IActionResult` únicamente cuando la action pueda devolver respuestas de éxito sin contenido o tipos incompatibles justificados.

### Códigos esperados

| Operación | Respuesta de éxito |
|---|---|
| Consulta individual | `200 OK` |
| Listado o búsqueda | `200 OK` |
| Creación | `201 Created` |
| Actualización completa | `200 OK` o `204 No Content`, según convención global |
| Confirmar/cerrar/cancelar | `200 OK` o `204 No Content`, según si devuelve resumen |
| Eliminación lógica/desactivación | `204 No Content` |

Para creación, preferir `CreatedAtAction`:

```csharp
return CreatedAtAction(
    nameof(GetById),
    new { id = result.Id },
    ApiResponse.Success(result, HttpContext.TraceIdentifier));
```

No devolver siempre `200 OK` para todas las operaciones.

---

## Contrato estándar de respuesta

Conservar el contrato global del proyecto:

```json
{
  "success": true,
  "data": {},
  "message": "Operación realizada correctamente",
  "errors": [],
  "correlationId": "..."
}
```

Los controladores solo construyen respuestas exitosas. Los errores deben ser transformados por componentes globales:

```text
FluentValidation pipeline
Exception handler global
ProblemDetails factory o adaptador al contrato estándar
Authorization middleware
Concurrency exception handler
```

No repetir bloques como este en cada action:

```csharp
try
{
    // ...
}
catch (Exception exception)
{
    return StatusCode(500, exception.Message);
}
```

Nunca exponer stack traces, mensajes internos de PostgreSQL o detalles de excepciones en producción.

---

## Validación

Las validaciones sintácticas y de entrada deben ejecutarse mediante FluentValidation en el pipeline de `Application` o en el mecanismo transversal acordado.

Ejemplos:

```text
Campo obligatorio
Longitud máxima
Formato de correo
Valor decimal no negativo
Cantidad mayor a cero
Identificador no vacío
```

Las invariantes y reglas de negocio deben permanecer en `Domain` o en el caso de uso correspondiente:

```text
SKU único
Producto activo
Existencia suficiente
Venta confirmable
Monto de pago válido
Límite de crédito disponible
```

El controller no debe consultar la base de datos para validar.

`[ApiController]` puede manejar errores de model binding, pero la respuesta producida debe adaptarse al contrato de error global.

---

## Seguridad y permisos

Aplicar autorización declarativa:

```csharp
[Authorize(Policy = Permissions.Products.View)]
[HttpGet("{id:guid}")]
public async Task<ActionResult<ApiResponse<ProductResponse>>> GetById(...)
```

```csharp
[Authorize(Policy = Permissions.Sales.Confirm)]
[HttpPost("{id:guid}/confirm")]
public async Task<ActionResult<ApiResponse<SaleSummaryResponse>>> Confirm(...)
```

Reglas:

- Todo endpoint de escritura requiere autenticación.
- Cada operación crítica requiere permiso granular.
- El controller no debe confiar en un `CreatedBy`, `AuthorizedBy` o `UserId` enviado en el body.
- La identidad debe obtenerse desde `ICurrentUser` o abstracción equivalente.
- Ocultar botones en frontend no sustituye la autorización del backend.
- No incluir secretos, hashes, tokens o datos internos en responses.
- No usar `[AllowAnonymous]` sin justificación explícita.

---

## Usuario actual

El controller puede obtener la identidad mediante una abstracción de presentación o aplicación:

```csharp
private readonly ICurrentUser _currentUser;
```

Sin embargo, cuando sea posible, el pipeline debe enriquecer el command con el contexto de usuario para evitar repetir esta lógica en cada action.

No leer claims por nombre literal en todos los controladores:

```csharp
User.FindFirst("user_id")?.Value
```

Centralizar esa traducción en una sola implementación de `ICurrentUser`.

---

## Operaciones asíncronas y cancelación

Toda action que realice I/O debe ser asíncrona y recibir `CancellationToken`:

```csharp
public async Task<ActionResult<ApiResponse<ProductResponse>>> GetById(
    Guid id,
    CancellationToken cancellationToken)
{
    var result = await _sender.Send(
        new GetProductByIdQuery(id),
        cancellationToken);

    return Ok(ApiResponse.Success(
        result,
        HttpContext.TraceIdentifier));
}
```

Prohibido:

```csharp
.Result
.Wait()
Task.Run(() => databaseCall())
CancellationToken.None
```

El token debe propagarse desde controller hasta handler, repositorio, EF Core e integraciones externas.

---

## Concurrencia e idempotencia

Para operaciones sensibles como confirmar, cancelar, cerrar recepciones o registrar pagos:

- El command debe validar el estado actual del documento.
- La transacción debe proteger inventario y dinero.
- Las excepciones de concurrencia deben convertirse en `409 Conflict`.
- Cuando el cliente envíe `RowVersion`, debe viajar en un request explícito.
- Repetir una confirmación no debe duplicar movimientos, pagos ni Domain Events.
- Cuando aplique, implementar una estrategia de idempotencia en `Application` o infraestructura; nunca dentro del controller.

Ejemplo de request:

```csharp
public sealed record ConfirmSaleRequest(string RowVersion);
```

---

## Documentación OpenAPI

Cada action debe declarar claramente sus respuestas:

```csharp
[ProducesResponseType(typeof(ApiResponse<ProductResponse>), StatusCodes.Status200OK)]
[ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
[ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
[ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
[ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
[ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
```

Documentar como mínimo:

- Propósito de la operación.
- Parámetros de ruta y filtros.
- Request y response.
- Permiso requerido.
- Estados posibles.
- Errores de validación y negocio relevantes.
- Ejemplo de payload cuando aporte claridad.

No documentar manualmente contratos que no coincidan con el código real.

---

## Logging y trazabilidad

El controller no debe registrar bodies completos ni datos sensibles.

Los logs deben ser estructurados e incluir, cuando corresponda:

```text
CorrelationId
UserId
Endpoint
HttpMethod
EntityId
ElapsedMilliseconds
StatusCode
```

El middleware debe administrar `CorrelationId`. El controller reutiliza:

```csharp
HttpContext.TraceIdentifier
```

No usar interpolación de strings para datos estructurados:

```csharp
_logger.LogInformation("Producto creado {ProductId}", result.Id);
```

Evitar logs redundantes en el controller si el pipeline ya registra la petición y el caso de uso.

---

## Ejemplo completo recomendado

```csharp
using Distribuidora.Application.Features.Products.CreateProduct;
using Distribuidora.Application.Features.Products.GetProductById;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Products;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Mime;

namespace Distribuidora.Api.Controllers.V1;

[ApiController]
[Route("api/v1/products")]
[Authorize]
[Produces(MediaTypeNames.Application.Json)]
public sealed class ProductsController : ControllerBase
{
    private readonly ISender _sender;

    public ProductsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Obtiene un producto por identificador.
    /// </summary>
    [HttpGet("{id:guid}", Name = nameof(GetById))]
    [Authorize(Policy = Permissions.Products.View)]
    [ProducesResponseType(typeof(ApiResponse<ProductResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ProductResponse>>> GetById(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new GetProductByIdQuery(id),
            cancellationToken);

        var response = new ProductResponse(
            result.Id,
            result.Sku,
            result.Name,
            result.BasePrice,
            result.IsActive);

        return Ok(ApiResponse.Success(
            response,
            HttpContext.TraceIdentifier));
    }

    /// <summary>
    /// Crea un producto nuevo.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = Permissions.Products.Create)]
    [ProducesResponseType(typeof(ApiResponse<ProductResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<ProductResponse>>> Create(
        [FromBody] CreateProductRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateProductCommand(
            request.Sku,
            request.Name,
            request.CategoryId,
            request.UnitId,
            request.Cost,
            request.BasePrice,
            request.MinimumStock);

        var result = await _sender.Send(command, cancellationToken);

        var response = new ProductResponse(
            result.Id,
            result.Sku,
            result.Name,
            result.BasePrice,
            result.IsActive);

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse.Success(
                response,
                HttpContext.TraceIdentifier,
                "Producto creado correctamente"));
    }
}
```

---

## Organización recomendada por módulo

```text
Distribuidora.Api/
  Controllers/
    V1/
      ProductsController.cs
      CustomersController.cs
      SuppliersController.cs
      InventoryController.cs
      InventoryAdjustmentsController.cs
      PurchasesController.cs
      GoodsReceiptsController.cs
      SalesController.cs
      PaymentsController.cs
      AccountsReceivableController.cs
      ReportsController.cs
```

Separar controladores cuando existan recursos, permisos o ciclos de vida diferentes. No crear un único `OperationsController` o `AdministrationController` con decenas de acciones sin relación.

Como referencia, un controlador debería mantenerse enfocado y fácil de revisar. Si crece demasiado, dividir por recurso HTTP, no por capricho técnico.

---

## Manejo global de errores

Configurar un exception handler global que convierta excepciones conocidas en respuestas consistentes:

| Excepción o condición | HTTP |
|---|---:|
| Request inválido | `400 Bad Request` |
| No autenticado | `401 Unauthorized` |
| Sin permiso | `403 Forbidden` |
| Recurso inexistente | `404 Not Found` |
| Duplicidad o concurrencia | `409 Conflict` |
| Regla de negocio no satisfecha | `422 Unprocessable Entity` |
| Error no controlado | `500 Internal Server Error` |

Ejemplos de excepciones de negocio:

```text
InsufficientStockException
ProductInactiveException
DocumentAlreadyConfirmedException
DocumentAlreadyCancelledException
CreditLimitExceededException
InvalidPaymentAmountException
```

El controller no decide cómo traducir cada excepción.

---

## Pruebas

No invertir esfuerzo excesivo en unit tests de controladores que solo delegan. Priorizar pruebas de integración con `WebApplicationFactory` para comprobar:

- Routing correcto.
- Model binding.
- Autenticación y permisos.
- Códigos HTTP.
- Contrato de respuesta.
- Validación.
- Propagación de `CancellationToken` cuando sea verificable.
- Creación con `Location` correcto.
- Traducción global de errores.
- No exposición de campos internos.

Las reglas de negocio deben probarse en `Domain` y en handlers de `Application`.

---

## Prohibiciones adicionales para agentes

Un agente no debe:

1. Crear un endpoint Minimal API aunque sea “solo temporal”.
2. Mezclar Controllers y Minimal APIs en el mismo proyecto.
3. generar clases `Endpoints`, `EndpointGroup` o `MapEndpoints`.
4. Colocar handlers dentro del archivo del controller.
5. Colocar DTOs públicos dentro del controller.
6. Usar el controller como unidad de transacción.
7. Inyectar `DbContext`, repositorios o servicios de infraestructura.
8. Devolver `200 OK` para errores de negocio.
9. Exponer entidades de dominio o persistencia.
10. Omitir autorización o documentación por considerar que Swagger es temporal.

---

## Checklist de revisión por controlador

Antes de aprobar un controller, verificar:

- [ ] Hereda de `ControllerBase`.
- [ ] Tiene `[ApiController]`.
- [ ] Tiene una ruta explícita y versionada.
- [ ] No existe un equivalente registrado mediante `MapGet`, `MapPost` u otra Minimal API.
- [ ] Depende solo de abstracciones permitidas.
- [ ] No inyecta `DbContext` ni repositorios.
- [ ] Cada action corresponde a un command o query.
- [ ] No contiene reglas de negocio.
- [ ] Recibe y propaga `CancellationToken`.
- [ ] Usa contratos HTTP separados de entidades y commands.
- [ ] Tiene autorización y permiso correctos.
- [ ] Declara códigos de respuesta en OpenAPI.
- [ ] Devuelve el código HTTP adecuado.
- [ ] Usa el contrato estándar de respuesta.
- [ ] Los errores se manejan globalmente.
- [ ] No registra ni expone datos sensibles.
- [ ] Las rutas y nombres son consistentes con otros módulos.
- [ ] Existen pruebas de integración para los flujos relevantes.

---

## Definition of Done

Un controller se considera terminado únicamente cuando:

1. Compila sin warnings relevantes.
2. Está registrado por `app.MapControllers()`.
3. Aparece correctamente en Swagger/OpenAPI.
4. Sus actions requieren autenticación y permisos según corresponda.
5. Delega completamente la ejecución a `Application`.
6. No contiene acceso a datos ni reglas de negocio.
7. Usa requests y responses públicos explícitos.
8. Maneja correctamente códigos HTTP y `Location` en creaciones.
9. Propaga `CancellationToken`.
10. Sus pruebas de integración pasan en PostgreSQL de prueba o contenedor equivalente.
11. No existe ninguna implementación Minimal API del mismo recurso.

---

## Prompt operativo para agentes

```text
Implementa la exposición HTTP del caso de uso solicitado exclusivamente mediante ASP.NET Core MVC Controllers. Usa clases selladas que hereden de ControllerBase con [ApiController], rutas explícitas bajo /api/v1, autorización declarativa, permisos granulares, contratos request/response separados, documentación OpenAPI y CancellationToken. El controller debe ser delgado y limitarse a mapear HTTP hacia un command/query de Application y convertir el resultado en una respuesta HTTP. Está prohibido usar Minimal APIs, MapGet, MapPost, MapGroup, IEndpointRouteBuilder, DbContext, repositorios, transacciones o reglas de negocio dentro del controller. Los errores deben resolverse mediante validación y exception handling global. Conserva Clean Architecture, Vertical Slice y Domain Events.
```

---

## Integración con el orquestador existente

Agregar esta skill a la lista obligatoria del archivo `00_ORQUESTADOR.md`:

```text
skills/skill_09_controllers_aspnet_core.md
```

También se debe sustituir cualquier regla ambigua como:

```text
Usar Minimal APIs agrupadas por módulo o Controllers con rutas claras.
```

por:

```text
Usar exclusivamente ASP.NET Core MVC Controllers basados en ControllerBase. Minimal APIs están prohibidas.
```
