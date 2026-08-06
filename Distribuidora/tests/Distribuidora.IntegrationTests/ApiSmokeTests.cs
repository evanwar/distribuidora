using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Distribuidora.Application.Abstractions;
using Distribuidora.Domain.Audits;

namespace Distribuidora.IntegrationTests;

public sealed class ApiSmokeTests : IClassFixture<DistribuidoraApiFactory>
{
    private readonly HttpClient _client;

    public ApiSmokeTests(DistribuidoraApiFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Health_endpoint_is_available()
    {
        var response = await _client.GetAsync("/api/v1/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task OpenApi_document_contains_operational_endpoints()
    {
        var response = await _client.GetAsync("/openapi/v1.json");
        var body = await response.Content.ReadAsStringAsync();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("/api/v1/counter-sales/{id}/confirm", body);
        Assert.Contains("/api/v1/counter-sales/{id}/card-payment/cancel", body);
        Assert.Contains("/api/v1/counter-sales/{saleId}/billing-eligibility", body);
        Assert.Contains("/api/v1/counter-sales/{saleId}/billing-recipient", body);
        Assert.Contains("/api/v1/counter-sales/{saleId}/fiscal-status", body);
        Assert.Contains("/api/v1/counter-sales/{saleId}/fiscal-coverage", body);
        Assert.Contains("/api/v1/goods-receipts", body);
        Assert.Contains("/api/v1/goods-receipts/{id}/close", body);
        Assert.Contains("/api/v1/inventory/adjustments", body);
        Assert.Contains("/api/v1/inventory/kardex", body);
        Assert.Contains("/api/v1/customers", body);
        Assert.Contains("/api/v1/suppliers", body);
        Assert.Contains("/api/v1/products", body);
        Assert.Contains("/api/v1/warehouses", body);
        Assert.Contains("/api/v1/reports/gross-profit", body);
        Assert.Contains("/api/v1/logs/activity", body);
        Assert.Contains("/api/v1/logs/errors", body);
        Assert.Contains("/api/v1/logs/events", body);
        Assert.Contains("/api/v1/trace/operations/{operationId}", body);
        Assert.DoesNotContain("\"/api/counter-sales", body);
    }

    [Fact]
    public async Task Scalar_api_reference_is_available()
    {
        var response = await _client.GetAsync("/scalar/v1");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Protected_write_endpoint_rejects_anonymous_request()
    {
        var response = await _client.PostAsync("/api/v1/counter-sales", JsonContent.Create(new { }));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"success\":false", body);
        Assert.Contains("\"correlationId\"", body);
    }

    [Fact]
    public async Task Correlation_header_is_accepted_and_returned()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/health");
        request.Headers.Add("X-Correlation-ID", "client-correlation-123");
        var response = await _client.SendAsync(request);
        Assert.Equal("client-correlation-123", response.Headers.GetValues("X-Correlation-ID").Single());
        Assert.False(string.IsNullOrWhiteSpace(response.Headers.GetValues("X-Operation-ID").Single()));
    }

    [Fact]
    public async Task Invalid_correlation_header_is_replaced()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/health");
        request.Headers.Add("X-Correlation-ID", "invalid value with spaces");
        var response = await _client.SendAsync(request);
        Assert.NotEqual("invalid value with spaces", response.Headers.GetValues("X-Correlation-ID").Single());
    }
}

public sealed class DistribuidoraApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, configuration) =>
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:AutoMigrate"] = "false",
                ["Logging:EnableOutboxProcessor"] = "false",
                ["Jwt:Key"] = "integration-test-key-with-at-least-32-characters",
                ["Jwt:Issuer"] = "Distribuidora.Api",
                ["Jwt:Audience"] = "Distribuidora.Client"
            }));
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IUserActivityLogWriter>();
            services.RemoveAll<ISystemErrorLogWriter>();
            services.AddSingleton<IUserActivityLogWriter, NoOpLogWriter>();
            services.AddSingleton<ISystemErrorLogWriter, NoOpLogWriter>();
        });
    }
}

public sealed class NoOpLogWriter : IUserActivityLogWriter, ISystemErrorLogWriter
{
    public Task WriteAsync(UserActivityLog entry, CancellationToken cancellationToken = default) => Task.CompletedTask;
    public Task WriteAsync(SystemErrorLog entry, CancellationToken cancellationToken = default) => Task.CompletedTask;
}
