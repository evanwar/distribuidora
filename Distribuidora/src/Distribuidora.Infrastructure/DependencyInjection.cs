using Distribuidora.Application.Abstractions;
using Distribuidora.Infrastructure.Persistence;
using Distribuidora.Infrastructure.Observability;
using Distribuidora.Infrastructure.Security;
using Distribuidora.Infrastructure.Payments;
using Distribuidora.Infrastructure.Invoicing;
using FiscalApi;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Distribuidora.Infrastructure;

public static class DependencyInjection
{
    private const int MercadoPagoHttpTimeoutSeconds = 20;

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("ConnectionStrings:Default must be explicitly configured.");
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
        services.Configure<MercadoPagoPointOptions>(configuration.GetSection(MercadoPagoPointOptions.SectionName));
        services.AddHttpClient<IMercadoPagoPointClient, MercadoPagoPointClient>((provider, client) =>
        {
            var options = provider.GetRequiredService<Microsoft.Extensions.Options.IOptions<MercadoPagoPointOptions>>().Value;
            client.BaseAddress = new Uri(options.BaseUrl);
            client.Timeout = TimeSpan.FromSeconds(MercadoPagoHttpTimeoutSeconds);
        });
        services.AddSingleton<IMercadoPagoWebhookValidator, MercadoPagoWebhookValidator>();
        services.AddFiscalApi(settings =>
        {
            settings.ApiUrl = configuration["ElectronicInvoicing:FiscalApi:ApiUrl"] ?? "https://test.fiscalapi.com";
            settings.ApiKey = configuration["ElectronicInvoicing:FiscalApi:ApiKey"] ?? "";
            settings.Tenant = configuration["ElectronicInvoicing:FiscalApi:Tenant"] ?? "";
            settings.ApiVersion = "v4";
            settings.TimeZone = configuration["ElectronicInvoicing:FiscalApi:TimeZone"] ?? "America/Mexico_City";
        });
        var providerName = configuration["ElectronicInvoicing:Provider"] ??
                           FiscalApiElectronicInvoicingProvider.ProviderName;
        if (!string.Equals(
                providerName,
                FiscalApiElectronicInvoicingProvider.ProviderName,
                StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Electronic invoicing provider '{providerName}' is not registered.");
        services.AddSingleton<IElectronicInvoicingProfile>(new ElectronicInvoicingProfile(
            configuration["ElectronicInvoicing:IssuerProviderId"] ?? "",
            configuration["ElectronicInvoicing:ExpeditionZipCode"] ?? "",
            configuration["ElectronicInvoicing:Series"] ?? "F"));
        services.AddScoped<IElectronicInvoicingProvider, FiscalApiElectronicInvoicingProvider>();
        return services;
    }
}
