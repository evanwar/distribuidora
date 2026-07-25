using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using Distribuidora.Api.Auth;
using Distribuidora.Api.Middleware;
using Distribuidora.Application;
using Distribuidora.Application.Abstractions;
using Distribuidora.Infrastructure;
using Distribuidora.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, HttpCurrentUser>();
builder.Services.AddControllers(options =>
    {
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
        var errors = context.ModelState.Values.SelectMany(x => x.Errors)
            .Select(x => string.IsNullOrWhiteSpace(x.ErrorMessage) ? "Invalid request." : x.ErrorMessage)
            .ToArray();
        return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(
            Distribuidora.Contracts.Common.ApiResponse<object>.Fail(
                "Request validation failed.", errors, context.HttpContext.TraceIdentifier));
    };
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Distribuidora Counter Sales API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization", Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT", In = ParameterLocation.Header
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = []
    });
});

var jwtKey = builder.Configuration["Jwt:Key"] ?? "development-only-key-change-before-production-123456";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true, ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "Distribuidora.Api",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "Distribuidora.Client",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.FromMinutes(1)
    };
    options.Events = new JwtBearerEvents
    {
        OnChallenge = async context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(
                Distribuidora.Contracts.Common.ApiResponse<object>.Fail(
                    "Authentication is required.", ["Authentication is required."], context.HttpContext.TraceIdentifier));
        },
        OnForbidden = async context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(
                Distribuidora.Contracts.Common.ApiResponse<object>.Fail(
                    "The current user does not have the required permission.",
                    ["The current user does not have the required permission."],
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
app.UseMiddleware<CorrelationAndOperationMiddleware>();
app.UseMiddleware<UserActivityLoggingMiddleware>();
app.UseMiddleware<ExceptionMiddleware>();
app.UseSwagger();
app.UseSwaggerUI();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

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
