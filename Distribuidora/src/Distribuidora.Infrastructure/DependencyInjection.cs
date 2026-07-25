using Distribuidora.Application.Abstractions;
using Distribuidora.Infrastructure.Persistence;
using Distribuidora.Infrastructure.Observability;
using Distribuidora.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Distribuidora.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? "Host=localhost;Port=5432;Database=distribuidora;Username=postgres;Password=postgres";
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
        services.AddDbContext<LoggingDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddScoped<ILogQueryStore>(provider => provider.GetRequiredService<LoggingDbContext>());
        services.AddScoped<IRequestTraceContext, RequestTraceContext>();
        services.AddScoped<IRequestMetadataAccessor, HttpRequestMetadataAccessor>();
        services.AddSingleton<ISensitiveDataSanitizer, SensitiveDataSanitizer>();
        services.AddSingleton<IDatatimeProvider, DatatimeProvider>();
        services.AddScoped<PostgresLogWriter>();
        services.AddScoped<IUserActivityLogWriter>(p => p.GetRequiredService<PostgresLogWriter>());
        services.AddScoped<ISystemErrorLogWriter>(p => p.GetRequiredService<PostgresLogWriter>());
        services.AddScoped<ISystemEventLogWriter>(p => p.GetRequiredService<PostgresLogWriter>());
        if (configuration.GetValue("Logging:EnableOutboxProcessor", true))
            services.AddHostedService<OutboxProcessor>();
        services.AddSingleton<IPasswordService, PasswordService>();
        services.AddSingleton<ITokenService, TokenService>();
        return services;
    }
}
