using System.Security.Claims;
using System.Globalization;
using System.Text;
using System.Text.Json.Serialization;
using Distribuidora.Api.Auth;
using Distribuidora.Api;
using Distribuidora.Api.Common;
using Distribuidora.Api.Middleware;
using Distribuidora.Application;
using Distribuidora.Application.Abstractions;
using Distribuidora.Infrastructure;
using Distribuidora.Infrastructure.Persistence;
using Distribuidora.Api.Features.Realtime;
using Distribuidora.Application.Realtime;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Localization;
using Microsoft.Extensions.Localization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Threading.RateLimiting;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddLocalization();
builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    var supportedCultures = new[] { new CultureInfo("es-MX"), new CultureInfo("en-US") };
    options.DefaultRequestCulture = new RequestCulture("es-MX");
    options.SupportedCultures = supportedCultures;
    options.SupportedUICultures = supportedCultures;
    options.ApplyCurrentCultureToResponseHeaders = true;
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.StatefulReconnectBufferSize = 100_000;
});
builder.Services.AddSingleton<IRealtimeEventPublisher, SignalRRealtimeEventPublisher>();
builder.Services.AddScoped<ICurrentUser, HttpCurrentUser>();
builder.Services.AddScoped<FluentValidationActionFilter>();
builder.Services.AddControllers(options =>
    {
        options.Filters.AddService<FluentValidationActionFilter>();
        foreach (var status in new[]
                 {
                     StatusCodes.Status400BadRequest,
                     StatusCodes.Status401Unauthorized,
                     StatusCodes.Status403Forbidden,
                     StatusCodes.Status404NotFound,
                     StatusCodes.Status409Conflict,
                     StatusCodes.Status422UnprocessableEntity,
                     StatusCodes.Status500InternalServerError
                 })
            options.Filters.Add(new Microsoft.AspNetCore.Mvc.ProducesResponseTypeAttribute(
                typeof(Distribuidora.Contracts.Common.ApiResponse<object>), status));
    })
    .AddJsonOptions(x => x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);
builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var messages = context.HttpContext.RequestServices.GetRequiredService<IStringLocalizer<ApiMessages>>();
        var errors = context.ModelState.Values.SelectMany(x => x.Errors)
            .Select(x => string.IsNullOrWhiteSpace(x.ErrorMessage) ? messages["InvalidRequest"].Value : x.ErrorMessage)
            .ToArray();
        return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(
            Distribuidora.Contracts.Common.ApiResponse<object>.Fail(
                messages["ValidationFailed"], errors, context.HttpContext.TraceIdentifier));
    };
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Distribuidora Counter Sales API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = []
    });
});

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    if (!builder.Environment.IsDevelopment())
        throw new InvalidOperationException("Jwt:Key must be supplied by a secret provider outside Development.");
    jwtKey = "local-development-key-not-for-production-123456789";
}
if (Encoding.UTF8.GetByteCount(jwtKey) < AuthenticationDefaults.MinimumJwtSigningKeyBytes)
    throw new InvalidOperationException($"Jwt:Key must contain at least {AuthenticationDefaults.MinimumJwtSigningKeyBytes} bytes.");
if (!builder.Environment.IsDevelopment() && jwtKey.Contains("development", StringComparison.OrdinalIgnoreCase))
    throw new InvalidOperationException("A development JWT key cannot be used outside Development.");
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("authentication", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = AuthenticationDefaults.LoginPermitLimit,
            Window = TimeSpan.FromMinutes(AuthenticationDefaults.LoginRateLimitWindowMinutes),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
});
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "Distribuidora.Api",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "Distribuidora.Client",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.FromMinutes(AuthenticationDefaults.JwtClockSkewMinutes)
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            if (!string.IsNullOrWhiteSpace(accessToken) &&
                context.HttpContext.Request.Path.StartsWithSegments(RealtimeHub.Route))
                context.Token = accessToken;
            return Task.CompletedTask;
        },
        OnChallenge = async context =>
        {
            var messages = context.HttpContext.RequestServices.GetRequiredService<IStringLocalizer<ApiMessages>>();
            var message = messages["AuthenticationRequired"].Value;
            context.HandleResponse();
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(
                Distribuidora.Contracts.Common.ApiResponse<object>.Fail(
                    message, [message], context.HttpContext.TraceIdentifier));
        },
        OnForbidden = async context =>
        {
            var messages = context.HttpContext.RequestServices.GetRequiredService<IStringLocalizer<ApiMessages>>();
            var message = messages["Forbidden"].Value;
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(
                Distribuidora.Contracts.Common.ApiResponse<object>.Fail(
                    message,
                    [message],
                    context.HttpContext.TraceIdentifier));
        }
    };
});
builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();
builder.Services.AddAuthorization(options =>
{
    foreach (var permission in Permissions.All) options.AddPolicy(permission, p => p.Requirements.Add(new PermissionRequirement(permission)));
});

var app = builder.Build();
app.UseRequestLocalization();
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}
app.UseMiddleware<CorrelationAndOperationMiddleware>();
app.UseMiddleware<UserActivityLoggingMiddleware>();
app.UseMiddleware<ExceptionMiddleware>();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.UseSwagger(options => options.RouteTemplate = "openapi/{documentName}.json");
app.MapScalarApiReference(options =>
{
    options.Title = "Distribuidora Counter Sales API";
    options.WithOpenApiRoutePattern("/openapi/{documentName}.json");
});
app.MapControllers();
app.MapHub<RealtimeHub>(RealtimeHub.Route, options => options.AllowStatefulReconnects = true);

if (app.Configuration.GetValue("Database:AutoMigrate", false))
{
    await using var scope = app.Services.CreateAsyncScope();
    await DatabaseSeeder.SeedAsync(
        scope.ServiceProvider.GetRequiredService<AppDbContext>(),
        scope.ServiceProvider.GetRequiredService<IPasswordService>(),
        app.Configuration);
}

app.Run();

public partial class Program;
