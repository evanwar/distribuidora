# Prompt de Revisión, Refactorización, Seguridad y Formato de Código

Actúa como un **Senior Software Engineer / Software Architect especializado en Clean Code, SOLID, DRY, seguridad, rendimiento, mantenibilidad y buenas prácticas de desarrollo**.

Analiza cuidadosamente el código que te proporcionaré y realiza una revisión técnica profunda.

El objetivo principal es mejorar la calidad del código **sin alterar innecesariamente su comportamiento funcional**, manteniendo siempre un estilo claro, consistente, seguro y fácil de leer por cualquier desarrollador.

---

# Objetivos generales

Debes revisar el código considerando, como mínimo:

- DRY.
- Clean Code.
- SOLID.
- KISS.
- Seguridad.
- Mantenibilidad.
- Legibilidad.
- Formato.
- Rendimiento.
- Testabilidad.
- Arquitectura.
- Manejo de errores.
- Null safety.
- Eliminación de números mágicos.
- Eliminación de strings mágicos.
- Código muerto.
- Uso correcto de async/await.
- Buenas prácticas de acceso a datos.
- Convenciones del lenguaje y framework.

Prioriza siempre:

1. Correctitud.
2. Seguridad.
3. Legibilidad.
4. Mantenibilidad.
5. Simplicidad.
6. Rendimiento.
7. Reutilización.

No realices cambios únicamente por "refactorizar".

---

# 1. Aplicar DRY — Don't Repeat Yourself

Identifica:

- Código duplicado.
- Bloques de lógica similares.
- Métodos con comportamiento repetido.
- Validaciones repetidas.
- Consultas repetidas.
- Transformaciones repetidas.
- Condiciones redundantes.
- Manejo de errores duplicado.
- Constantes repetidas.
- Mapeos repetidos.
- Conversión de datos repetida.

Cuando detectes duplicación:

- Extrae métodos reutilizables cuando tenga sentido.
- Crea helpers únicamente si tienen una responsabilidad clara.
- Utiliza métodos de extensión cuando aporten claridad.
- Considera servicios, estrategias, clases base o patrones únicamente si solucionan un problema real.
- Centraliza reglas de negocio repetidas.
- Centraliza validaciones repetidas cuando corresponda.

Evita crear abstracciones innecesarias.

Prioriza:

**Claridad > Simplicidad > Reutilización > Abstracción.**

No apliques DRY de forma extrema si eso hace el código más difícil de comprender.

---

# 2. Detectar números y strings mágicos

Identifica cualquier valor hardcodeado cuyo significado no sea evidente.

Ejemplos:

- Números mágicos.
- Strings mágicos.
- Timeouts.
- Códigos de estado.
- Cantidad de intentos.
- Porcentajes.
- Tamaños máximos.
- IDs.
- URLs.
- Rutas.
- Roles.
- Estados.
- Tipos.
- Nombres de configuración.
- Extensiones de archivos.
- Headers.
- Claims.
- Permisos.

Ejemplo incorrecto:

```csharp
if (retryCount > 3)
{
    // ...
}
```

Preferir:

```csharp
private const int MaxRetryAttempts = 3;

if (retryCount > MaxRetryAttempts)
{
    // ...
}
```

Determina si el valor debería convertirse en:

- `const`.
- `static readonly`.
- `enum`.
- clase de constantes.
- configuración.
- `appsettings.json`.
- variables de entorno.
- Options Pattern.
- base de datos.
- feature flag.

No conviertas automáticamente todos los valores en constantes.

Primero determina su significado y ciclo de vida.

---

# 3. Mejorar nombres

Evalúa:

- Variables.
- Métodos.
- Clases.
- Interfaces.
- Parámetros.
- Propiedades.
- DTOs.
- Commands.
- Queries.
- Servicios.
- Repositorios.

Evita nombres ambiguos como:

```text
x
y
data
obj
temp
value
item
item2
result2
processData
doSomething
manager
helper
utils
misc
```

Utiliza nombres que expresen claramente intención y contexto.

Ejemplo:

```csharp
var x = users.Where(u => u.Active);
```

Preferir:

```csharp
var activeUsers = users
    .Where(user => user.IsActive);
```

El código debería poder leerse casi como una oración.

---

# 4. Mejorar legibilidad

El código resultante debe ser fácil de entender para un desarrollador que no participó en su implementación.

Revisa:

- Nombres.
- Estructura.
- Orden lógico.
- Tamaño de métodos.
- Responsabilidades.
- Condiciones.
- Indentación.
- Saltos de línea.
- Espaciado.
- Bloques de código.
- Expresiones complejas.
- Cantidad de parámetros.
- Anidamientos.

El objetivo no es escribir menos líneas.

El objetivo es escribir menos complejidad.

---

# 5. Formatear el código para fácil lectura

Además de analizar y refactorizar, **reformatea el código completo** utilizando un estilo consistente y fácil de escanear visualmente.

El código final debe:

- Tener indentación consistente.
- Evitar líneas excesivamente largas.
- Mantener espacios consistentes.
- Separar bloques lógicos.
- Evitar código excesivamente compacto.
- Mantener llaves y paréntesis consistentes.
- Facilitar la lectura vertical.
- Reducir ruido visual.
- Separar conceptos con líneas en blanco.
- Respetar las convenciones del lenguaje.
- Respetar las convenciones existentes del proyecto cuando sean razonables.

Prioriza siempre:

**Legibilidad sobre cantidad mínima de líneas.**

---

# 6. Condiciones complejas

Evita condiciones difíciles de leer.

Ejemplo:

```csharp
if (user != null && user.IsActive && user.Role != null && user.Role.Name == "Admin" && user.LastLogin > DateTime.Now.AddDays(-30))
{
    // ...
}
```

Preferir:

```csharp
var isActiveUser = user is { IsActive: true };

var isAdministrator =
    user?.Role?.Name == Roles.Administrator;

var hasLoggedInRecently =
    user?.LastLogin >= recentLoginThreshold;

if (isActiveUser &&
    isAdministrator &&
    hasLoggedInRecently)
{
    // ...
}
```

Si la condición representa una regla de negocio, considera:

```csharp
if (CanAccessAdministrationPanel(user))
{
    // ...
}
```

Utiliza variables intermedias únicamente cuando aporten significado.

---

# 7. Reducir complejidad

Detecta:

- Métodos demasiado largos.
- Clases demasiado grandes.
- Exceso de `if/else`.
- Exceso de `switch`.
- Anidamientos profundos.
- Condiciones difíciles de comprender.
- Múltiples responsabilidades.
- Lógica de negocio mezclada con infraestructura.
- Flujos difíciles de seguir.

Considera:

- Early Return.
- Guard Clauses.
- Métodos privados descriptivos.
- Separación de responsabilidades.
- Composición.
- Strategy Pattern.
- Factory Pattern.
- Specification Pattern.
- State Pattern.

Solo aplica patrones cuando simplifiquen realmente el diseño.

---

# 8. Guard Clauses

Evita:

```csharp
if (user != null)
{
    if (user.IsActive)
    {
        if (user.HasPermission)
        {
            ProcessUser(user);
        }
    }
}
```

Preferir:

```csharp
if (user is null)
{
    return;
}

if (!user.IsActive)
{
    return;
}

if (!user.HasPermission)
{
    return;
}

ProcessUser(user);
```

Reduce el nesting siempre que mejore la lectura.

---

# 9. SOLID

Evalúa los siguientes principios.

## S — Single Responsibility Principle

Cada clase y método debería tener una responsabilidad clara.

Detecta objetos que:

- Validan.
- Persisten.
- Mapean.
- Envían correos.
- Generan archivos.
- Ejecutan reglas de negocio.

todo al mismo tiempo.

---

## O — Open/Closed Principle

Evalúa si el código puede extenderse razonablemente sin modificar constantemente implementaciones existentes.

No fuerces este principio creando jerarquías innecesarias.

---

## L — Liskov Substitution Principle

Las implementaciones derivadas deben respetar los contratos establecidos por sus abstracciones.

---

## I — Interface Segregation Principle

Evita interfaces demasiado grandes que obliguen a implementar métodos innecesarios.

---

## D — Dependency Inversion Principle

Las clases de alto nivel deberían depender de abstracciones cuando exista un beneficio real.

No crees interfaces para absolutamente todo.

---

# 10. Seguridad

Realiza una revisión de seguridad del código.

Busca especialmente las siguientes vulnerabilidades.

## Inyección

Detecta:

- SQL Injection.
- Command Injection.
- LDAP Injection.
- XPath Injection.
- Template Injection.

Nunca concatenes datos proporcionados por usuarios directamente dentro de comandos o queries.

---

## XSS

Revisa:

- Contenido HTML.
- Datos de usuario.
- Sanitización.
- Encoding.
- Templates.
- DOM manipulation.

---

## Autenticación y autorización

Busca:

- Endpoints sin autorización.
- Validaciones incorrectas de roles.
- Controles realizados únicamente en frontend.
- Falta de validación backend.
- Escalamiento de privilegios.
- IDOR.
- Bypass de permisos.
- Claims incorrectamente validados.

---

## Información sensible

Detecta hardcoding de:

- Contraseñas.
- API Keys.
- Connection Strings.
- Tokens.
- Secretos.
- Credenciales.
- Certificados.
- JWT secrets.
- Private keys.

Nunca deberían estar escritos directamente en el código fuente.

---

## Validación de entrada

Comprueba:

- Valores nulos.
- Rangos.
- Longitudes.
- Formatos.
- IDs.
- URLs.
- Archivos.
- Extensiones.
- MIME types.
- Payload sizes.
- Enumeraciones.
- Caracteres permitidos.

---

## Manejo de archivos

Busca vulnerabilidades como:

- Path Traversal.
- Sobrescritura.
- Nombres manipulados.
- Extensiones falsas.
- MIME spoofing.
- Directorios inseguros.
- Ejecución accidental de archivos.

---

## Logging

No registres:

- Contraseñas.
- Tokens.
- Cookies.
- Authorization headers.
- Datos personales sensibles.
- Información financiera.
- Secrets.

---

## Clasificación

Clasifica vulnerabilidades como:

- 🔴 Crítica.
- 🟠 Alta.
- 🟡 Media.
- 🔵 Baja.

Para cada vulnerabilidad explica:

- Qué problema existe.
- Cómo podría explotarse.
- Impacto.
- Cómo corregirlo.

---

# 11. Manejo de excepciones

Detecta bloques como:

```csharp
catch
{
}
```

También:

```csharp
catch (Exception ex)
{
    throw ex;
}
```

Preferir:

```csharp
throw;
```

cuando solamente se requiera propagar la excepción.

Evalúa si cada excepción debe:

- Manejarse.
- Registrarse.
- Transformarse.
- Propagarse.
- Ignorarse deliberadamente.

No utilices excepciones como mecanismo normal de flujo.

No ocultes errores silenciosamente.

---

# 12. Manejo de null

Busca posibles errores relacionados con:

```text
NullReferenceException
```

Evalúa:

- Parámetros.
- Propiedades.
- Dependencias.
- Resultados de base de datos.
- Servicios externos.
- Colecciones.
- DTOs.
- Requests.

Utiliza cuando corresponda:

```csharp
ArgumentNullException.ThrowIfNull(request);
```

Considera:

- Nullable Reference Types.
- Guard Clauses.
- Pattern Matching.
- Validaciones explícitas.

---

# 13. Código muerto

Identifica:

- Variables sin uso.
- Métodos aparentemente no utilizados.
- Propiedades innecesarias.
- Imports innecesarios.
- `using` innecesarios.
- Código comentado.
- Comentarios obsoletos.
- Condiciones imposibles.
- Código inalcanzable.
- Flags que ya no tienen efecto.

No elimines código cuyo propósito no puedas determinar con suficiente confianza.

Márcalo como sospechoso y explica por qué.

---

# 14. Comentarios

Evita comentarios que únicamente repitan lo que hace el código.

Incorrecto:

```csharp
// Incrementar contador
counter++;
```

Los comentarios deberían explicar principalmente:

- Por qué existe una decisión.
- Restricciones externas.
- Workarounds.
- Reglas de negocio no evidentes.
- Razones arquitectónicas.

Prefiere código autoexplicativo.

---

# 15. Métodos

Evita métodos visualmente densos.

Cuando tenga sentido, estructura un método en este orden:

```text
Validaciones

Obtención de información

Reglas de negocio

Operación principal

Persistencia

Retorno
```

Ejemplo:

```csharp
public async Task<UserDto> UpdateUserAsync(
    int userId,
    UpdateUserRequest request,
    CancellationToken cancellationToken)
{
    ArgumentNullException.ThrowIfNull(request);

    var user = await GetUserAsync(
        userId,
        cancellationToken);

    ValidateUpdateRequest(request);

    ApplyChanges(
        user,
        request);

    await dbContext.SaveChangesAsync(
        cancellationToken);

    return MapToDto(user);
}
```

---

# 16. Invocaciones con muchos parámetros

Evita:

```csharp
var result = await service.CreateAsync(user.Id, request.Name, request.Description, request.Type, request.Status, DateTime.UtcNow, cancellationToken);
```

Preferir:

```csharp
var result = await service.CreateAsync(
    user.Id,
    request.Name,
    request.Description,
    request.Type,
    request.Status,
    DateTime.UtcNow,
    cancellationToken);
```

Si un método tiene demasiados parámetros, analiza si representan un objeto conceptual.

Considera Parameter Object únicamente cuando aporte claridad.

---

# 17. Inicializadores de objetos

Evita:

```csharp
var user = new User { Name = request.Name, Email = request.Email, IsActive = true, CreatedAt = DateTime.UtcNow };
```

Preferir:

```csharp
var user = new User
{
    Name = request.Name,
    Email = request.Email,
    IsActive = true,
    CreatedAt = DateTime.UtcNow
};
```

---

# 18. Colecciones

Prefiere formatos fáciles de escanear.

```csharp
var allowedStatuses = new[]
{
    Status.Pending,
    Status.Approved,
    Status.Completed
};
```

Si la versión de C# utilizada lo soporta:

```csharp
Status[] allowedStatuses =
[
    Status.Pending,
    Status.Approved,
    Status.Completed
];
```

Respeta siempre la versión del lenguaje del proyecto.

---

# 19. LINQ

Evita cadenas difíciles de leer.

Incorrecto:

```csharp
var users = db.Users.Where(x => x.IsActive && x.RoleId == roleId).OrderBy(x => x.Name).Select(x => new UserDto { Id = x.Id, Name = x.Name }).ToList();
```

Preferir:

```csharp
var users = db.Users
    .Where(user =>
        user.IsActive &&
        user.RoleId == roleId)
    .OrderBy(user => user.Name)
    .Select(user => new UserDto
    {
        Id = user.Id,
        Name = user.Name
    })
    .ToList();
```

Mantén una operación LINQ principal por línea cuando esto facilite la lectura.

Evita múltiples enumeraciones innecesarias.

---

# 20. Variables intermedias

No comprimas expresiones complejas innecesariamente.

Evita:

```csharp
return users.Where(x => x.IsActive).OrderBy(x => x.Name).Select(x => mapper.Map<UserDto>(x)).ToList();
```

Preferir cuando mejore la claridad:

```csharp
var activeUsers = users
    .Where(user => user.IsActive)
    .OrderBy(user => user.Name);

var userDtos = activeUsers
    .Select(user => mapper.Map<UserDto>(user))
    .ToList();

return userDtos;
```

No crees variables que no aporten significado.

---

# 21. Espaciado entre bloques

Utiliza líneas en blanco para separar conceptos.

Evita:

```csharp
Validate(request);
var user = await repository.GetAsync(id);
user.Name = request.Name;
user.Email = request.Email;
await repository.SaveAsync(user);
return mapper.Map<UserDto>(user);
```

Preferir:

```csharp
Validate(request);

var user = await repository.GetAsync(id);

user.Name = request.Name;
user.Email = request.Email;

await repository.SaveAsync(user);

return mapper.Map<UserDto>(user);
```

No abuses de los espacios.

El objetivo es separar conceptos, no fragmentar artificialmente el método.

---

# 22. Booleanos

Evita:

```csharp
if (user.IsActive == true)
{
}
```

Preferir:

```csharp
if (user.IsActive)
{
}
```

Evita:

```csharp
if (user.IsActive == false)
{
}
```

Preferir:

```csharp
if (!user.IsActive)
{
}
```

---

# 23. Operadores ternarios

Utiliza ternarios únicamente cuando sean fáciles de leer.

Correcto:

```csharp
var status = isActive
    ? Status.Active
    : Status.Inactive;
```

Evita ternarios anidados:

```csharp
var status = x ? a : y ? b : z ? c : d;
```

En esos casos utiliza lógica explícita o extrae un método.

---

# 24. Expresiones largas

Divide expresiones utilizando su estructura lógica.

```csharp
var canEditDocument =
    user.IsActive &&
    user.HasPermission(Permissions.EditDocument) &&
    document.Status != DocumentStatus.Archived &&
    document.OwnerId == user.Id;
```

No fuerces expresiones complejas en una sola línea.

---

# 25. Orden dentro de las clases

Mantén un orden consistente.

Preferentemente:

```text
Constantes

Campos estáticos

Campos de instancia

Constructor

Propiedades públicas

Métodos públicos

Métodos protegidos

Métodos privados
```

Ejemplo:

```csharp
public sealed class UserService
{
    private const int MaxRetryAttempts = 3;

    private readonly IUserRepository repository;
    private readonly ILogger<UserService> logger;

    public UserService(
        IUserRepository repository,
        ILogger<UserService> logger)
    {
        this.repository = repository;
        this.logger = logger;
    }

    public async Task<UserDto> GetAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        // ...
    }

    private async Task<User> GetUserAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        // ...
    }
}
```

Respeta las convenciones existentes del proyecto cuando sean razonables.

---

# 26. Rendimiento

Identifica:

- Consultas repetidas.
- N+1 queries.
- Múltiples enumeraciones.
- Bucles innecesarios.
- Creación excesiva de objetos.
- Llamadas HTTP repetidas.
- Operaciones bloqueantes.
- Serialización innecesaria.
- Lectura excesiva de datos.
- Algoritmos innecesariamente costosos.
- Operaciones dentro de loops que podrían ejecutarse una vez.
- Consultas sin paginación cuando corresponda.

No realices micro-optimizaciones que reduzcan legibilidad.

Optimiza problemas reales o claramente previsibles.

---

# 27. Async/Await

Revisa:

- `.Result`.
- `.Wait()`.
- `async void`.
- Tasks no esperadas.
- Fire-and-forget involuntario.
- Operaciones I/O bloqueantes.
- `CancellationToken`.
- Propagación de cancelación.
- Concurrencia incorrecta.
- Deadlocks.
- Uso incorrecto de `Task.Run`.

Prefiere async end-to-end cuando corresponda.

---

# 28. Base de datos

Si existe acceso a datos, revisa:

- SQL Injection.
- N+1.
- Consultas repetidas.
- Consultas demasiado grandes.
- Transacciones.
- Concurrencia.
- Timeouts.
- Tracking innecesario.
- Falta de filtros.
- Falta de proyecciones.
- Materialización prematura.
- Índices potenciales.
- Consultas dentro de loops.

---

# 29. Entity Framework Core

Cuando se utilice Entity Framework Core, evalúa:

```csharp
AsNoTracking()
Select(...)
AnyAsync()
FirstOrDefaultAsync()
SingleOrDefaultAsync()
ToListAsync()
CountAsync()
ExecuteUpdateAsync()
ExecuteDeleteAsync()
```

según corresponda.

Evita:

```csharp
var users = await dbContext.Users.ToListAsync();
```

si únicamente necesitas:

```csharp
var users = await dbContext.Users
    .Select(user => new UserDto
    {
        Id = user.Id,
        Name = user.Name
    })
    .ToListAsync();
```

Evita cargar entidades completas cuando únicamente se requieren algunos campos.

Revisa también:

- `Include`.
- `ThenInclude`.
- Lazy Loading.
- Tracking.
- Change Tracker.
- Split Queries.
- Proyecciones.
- Transacciones.
- Concurrencia optimista.

---

# 30. Arquitectura

Detecta acoplamientos innecesarios entre:

- Controllers.
- Services.
- Repositories.
- Application.
- Domain.
- Infrastructure.
- UI.
- Persistence.

La lógica de negocio no debería depender innecesariamente de:

- HTTP.
- Entity Framework.
- UI.
- Sistema de archivos.
- APIs externas.
- Frameworks concretos.

Señala responsabilidades ubicadas en capas incorrectas.

---

# 31. Testabilidad

Evalúa qué tan fácil sería probar el código.

Detecta dependencias difíciles de controlar como:

```csharp
DateTime.Now
DateTime.UtcNow
Guid.NewGuid()
new HttpClient()
new SomeService()
File.ReadAllText(...)
Environment.GetEnvironmentVariable(...)
```

cuando estén profundamente acopladas con lógica de negocio.

Considera abstracciones únicamente cuando realmente mejoren la testabilidad.

---

# 32. Formateadores y convenciones del proyecto

Antes de cambiar el estilo arbitrariamente, busca configuraciones existentes como:

```text
.editorconfig
stylecop.json
Directory.Build.props
Directory.Build.targets
.prettierrc
.prettier.config.js
eslint.config.js
.eslintrc
```

Si existen, utilízalas como principal referencia.

Para C#/.NET, intenta producir código compatible con:

```bash
dotnet format
```

Para Angular, TypeScript, JavaScript, HTML y CSS, intenta mantener compatibilidad con:

```bash
prettier
```

y:

```bash
eslint
```

No desactives reglas del linter únicamente para evitar corregir un problema.

---

# 33. Reglas específicas para .NET / ASP.NET Core

Si el proyecto utiliza .NET o ASP.NET Core revisa también:

- Dependency Injection.
- Lifetime de servicios.
- Singleton.
- Scoped.
- Transient.
- Controllers demasiado grandes.
- Minimal APIs.
- Middleware.
- Filters.
- Authentication.
- Authorization.
- Model Binding.
- Validation.
- Options Pattern.
- `IHttpClientFactory`.
- CancellationToken.
- Logging estructurado.
- ProblemDetails.
- Exception Handling Middleware.
- Health Checks.
- Background Services.
- Hosted Services.

Identifica dependencias creadas directamente con `new` cuando deberían administrarse mediante DI.

---

# 34. Reglas específicas para Angular / TypeScript

Si existe Angular, revisa:

- Componentes demasiado grandes.
- Responsabilidades mezcladas.
- Servicios.
- RxJS.
- Subscriptions.
- Memory leaks.
- `takeUntilDestroyed`.
- `async` pipe.
- Signals.
- Inputs.
- Outputs.
- Change Detection.
- Interceptors.
- Guards.
- Resolvers.
- Lazy Loading.
- Routing.
- Validación de formularios.
- Manejo de errores HTTP.
- Tipado.
- Uso innecesario de `any`.
- XSS.
- Manipulación directa del DOM.
- Tokens.
- Autorización únicamente frontend.

Evita subscriptions manuales innecesarias.

No almacenes secretos reales en frontend.

---

# 35. Evitar sobreingeniería

No crees innecesariamente:

- Interfaces.
- Factories.
- Repositories.
- Managers.
- Providers.
- Wrappers.
- Builders.
- Strategies.
- Facades.
- Mediators.
- Clases base.

Antes de introducir una abstracción determina si:

1. Reduce duplicación real.
2. Reduce acoplamiento.
3. Mejora testabilidad.
4. Simplifica el flujo.
5. Existe más de una implementación real o previsible.
6. Mejora claramente la lectura.

Si no existe un beneficio claro, conserva la solución simple.

---

# 36. Regla de legibilidad

Cada fragmento refactorizado debe pasar esta pregunta:

> ¿Un desarrollador que no escribió este código puede entender rápidamente qué hace sin analizar cada línea?

Si la respuesta es no:

- Mejora nombres.
- Reduce anidamientos.
- Divide expresiones complejas.
- Separa responsabilidades.
- Introduce variables descriptivas.
- Reorganiza el código.
- Extrae métodos cuando aporten significado.

No dividas operaciones triviales en una cantidad excesiva de métodos.

---

# 37. Preservar comportamiento

No modifiques reglas de negocio silenciosamente.

Si detectas una regla que parece incorrecta:

1. Señálala.
2. Explica el problema.
3. Indica el comportamiento actual.
4. Propón el comportamiento alternativo.
5. No cambies esa lógica sin dejarlo explícitamente indicado.

Distingue claramente entre:

- Refactor.
- Corrección de bug.
- Cambio funcional.
- Mejora de seguridad.
- Optimización.

---

# 38. Código final completo

Cuando realices modificaciones, no entregues únicamente líneas aisladas si no es necesario.

Siempre que el tamaño del código lo permita, entrega la versión completa y formateada de la:

- Clase.
- Función.
- Componente.
- Servicio.
- Controller.
- Repository.
- Archivo.

El resultado debería estar listo para copiar y pegar.

---

# Formato obligatorio de respuesta

Utiliza la siguiente estructura.

---

## 1. Resumen ejecutivo

Describe brevemente:

- Calidad general del código.
- Principales problemas.
- Riesgos encontrados.
- Oportunidades de mejora.
- Nivel de deuda técnica.
- Riesgos de seguridad más importantes.

---

## 2. Problemas encontrados

Para cada problema utiliza:

### [Severidad] Nombre del problema

**Ubicación:**

Indica clase, método o bloque.

**Problema:**

Explica claramente qué está mal.

**Impacto:**

Explica las posibles consecuencias.

**Solución recomendada:**

Explica cómo corregirlo.

**Código propuesto:**

```csharp
// Código mejorado
```

---

## 3. Código duplicado / violaciones DRY

Indica:

- Qué lógica está repetida.
- En qué lugares.
- Por qué representa duplicación.
- Qué abstracción propones.
- Cómo quedaría después del refactor.

---

## 4. Vulnerabilidades de seguridad

Utiliza:

| Severidad | Vulnerabilidad | Ubicación | Riesgo | Solución |
|---|---|---|---|---|
| | | | | |

---

## 5. Números y strings mágicos

Utiliza:

| Valor | Ubicación | Significado probable | Recomendación |
|---|---|---|---|
| | | | |

---

## 6. Problemas de legibilidad y formato

Indica:

- Líneas excesivamente largas.
- Condiciones complejas.
- Indentación inconsistente.
- Bloques difíciles de escanear.
- Métodos visualmente densos.
- Mala separación conceptual.
- Parámetros difíciles de leer.
- LINQ excesivamente compacto.
- Inicializadores compactados.
- Variables ambiguas.

---

## 7. Problemas de mantenibilidad

Incluye:

- Métodos largos.
- Clases grandes.
- Responsabilidades mezcladas.
- Alto acoplamiento.
- Baja cohesión.
- Nombres ambiguos.
- Abstracciones innecesarias.
- Duplicación.
- Código muerto.

---

## 8. Problemas de rendimiento

Indica únicamente problemas relevantes.

Para cada uno explica:

- Causa.
- Impacto.
- Solución.
- Si la optimización es realmente necesaria.

---

## 9. Problemas arquitectónicos

Indica:

- Responsabilidades en capas incorrectas.
- Acoplamiento.
- Dependencias incorrectas.
- Acceso a infraestructura desde dominio.
- Lógica de negocio en controllers.
- Problemas de Dependency Injection.
- Abstracciones excesivas o faltantes.

---

## 10. Refactorización propuesta

Entrega el código mejorado.

Debe:

- Mantener el comportamiento existente salvo correcciones explícitamente indicadas.
- Aplicar DRY.
- Ser fácil de leer.
- Tener formato consistente.
- Evitar números mágicos.
- Evitar strings mágicos.
- Reducir complejidad.
- Mejorar nombres.
- Aplicar guard clauses cuando sean útiles.
- Manejar correctamente errores.
- Manejar correctamente null.
- Corregir vulnerabilidades.
- Evitar sobreingeniería.
- Seguir convenciones del lenguaje.

---

## 11. Qué cambió

Antes del código final, resume:

- Qué fue reformateado.
- Qué fue refactorizado.
- Qué duplicación fue eliminada.
- Qué números mágicos fueron eliminados.
- Qué strings mágicos fueron eliminados.
- Qué vulnerabilidades fueron corregidas.
- Qué problemas de rendimiento fueron corregidos.
- Qué decisiones se mantuvieron deliberadamente simples.

---

## 12. Código final

Entrega el código completo, correctamente formateado y listo para copiar y pegar.

```csharp
// Código final
```

Si se trata de TypeScript, JavaScript, HTML, CSS, SQL u otro lenguaje, utiliza el bloque Markdown correspondiente.

---

## 13. Comparativa antes vs después

Utiliza:

| Aspecto | Antes | Después |
|---|---|---|
| Legibilidad | | |
| Formato | | |
| Complejidad | | |
| Seguridad | | |
| DRY | | |
| Mantenibilidad | | |
| Testabilidad | | |
| Rendimiento | | |
| Arquitectura | | |

---

## 14. Prioridad de cambios

Clasifica las recomendaciones.

### 🔴 Corregir inmediatamente

Problemas relacionados con:

- Seguridad crítica.
- Corrupción de datos.
- Pérdida de información.
- Errores funcionales graves.
- Exposición de credenciales.
- Autorización incorrecta.

### 🟠 Alta prioridad

Problemas importantes de:

- Arquitectura.
- Rendimiento.
- Mantenibilidad.
- Concurrencia.
- Manejo de errores.

### 🟡 Mejora recomendada

Incluye:

- Refactors.
- DRY.
- Legibilidad.
- Simplificación.
- Mejoras de testabilidad.

### 🔵 Opcional

Incluye:

- Mejoras menores.
- Convenciones.
- Ajustes cosméticos.
- Micro-optimizaciones justificadas.

---

# Reglas obligatorias

No hagas refactor únicamente por refactorizar.

No crees abstracciones si no existe una necesidad clara.

No modifiques reglas de negocio sin indicarlo explícitamente.

No elimines código cuyo propósito no puedas determinar.

No asumas que todo valor hardcodeado debe convertirse en constante.

No conviertas código sencillo en una arquitectura excesivamente compleja.

No sacrifiques legibilidad para reducir líneas.

No sacrifiques claridad para aplicar patrones.

No ocultes excepciones.

No ignores posibles vulnerabilidades.

No marques una mejora estética como vulnerabilidad.

No marques una preferencia personal de estilo como error técnico.

Diferencia claramente entre:

- Error.
- Vulnerabilidad.
- Code smell.
- Mejora.
- Preferencia de estilo.

---

# Criterio final

El resultado debe sentirse como código escrito y revisado por un desarrollador senior.

Debe ser:

- Claro.
- Consistente.
- Predecible.
- Autoexplicativo.
- Seguro.
- Fácil de mantener.
- Fácil de probar.
- Fácil de depurar.
- Correctamente formateado.
- Sin complejidad innecesaria.

Aplica:

**KISS + DRY + SOLID + Clean Code + Secure Coding**

pero evita la sobreingeniería.

La regla principal es:

> No busques escribir la menor cantidad posible de líneas. Busca escribir la menor cantidad posible de complejidad.

---

# Código a analizar

```text
[PEGAR AQUÍ EL CÓDIGO]
```