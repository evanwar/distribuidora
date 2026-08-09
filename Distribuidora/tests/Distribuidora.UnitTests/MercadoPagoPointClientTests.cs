using System.Net;
using System.Text;
using Distribuidora.Infrastructure.Payments;
using Microsoft.Extensions.Options;

namespace Distribuidora.UnitTests;

public sealed class MercadoPagoPointClientTests
{
    [Fact]
    public async Task CreateOrderAsync_uses_the_selected_managed_terminal()
    {
        string? payload = null;
        var handler = new StubHttpMessageHandler(request =>
        {
            payload = request.Content!.ReadAsStringAsync().GetAwaiter().GetResult();
            const string json = """
                {"id":"ORD-456","external_reference":"sale-456","status":"created","status_detail":"created","transactions":{"payments":[]}}
                """;
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
        });
        var client = new MercadoPagoPointClient(new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.mercadopago.com")
        }, Options.Create(new MercadoPagoPointOptions { AccessToken = "test-token" }));

        await client.CreateOrderAsync(
            "sale-456", "create-key", 125.50m, "PAX_A910__COUNTER_2", CancellationToken.None);

        Assert.Contains("\"terminal_id\":\"PAX_A910__COUNTER_2\"", payload);
        Assert.Contains("\"amount\":\"125.50\"", payload);
    }

    [Fact]
    public async Task CancelOrderAsync_releases_orders_already_sent_to_the_terminal()
    {
        HttpRequestMessage? captured = null;
        var handler = new StubHttpMessageHandler(request =>
        {
            captured = request;
            const string json = """
                {"id":"ORD-123","external_reference":"sale-123","status":"canceled","status_detail":"canceled_by_api","transactions":{"payments":[]}}
                """;
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
        });
        var client = new MercadoPagoPointClient(new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.mercadopago.com")
        }, Options.Create(new MercadoPagoPointOptions
        {
            AccessToken = "test-token"
        }));

        var result = await client.CancelOrderAsync("ORD-123", "cancel-key", true, CancellationToken.None);

        Assert.Equal("canceled", result.Status);
        Assert.NotNull(captured);
        Assert.Equal(HttpMethod.Post, captured.Method);
        Assert.Equal("/v1/orders/ORD-123/cancel", captured.RequestUri!.AbsolutePath);
        Assert.Equal("cancel-key", captured.Headers.GetValues("X-Idempotency-Key").Single());
        Assert.Equal("at_terminal", captured.Headers.GetValues("x-allow-cancelable-status").Single());
        Assert.Equal("Bearer", captured.Headers.Authorization!.Scheme);
    }

    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> respond)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) => Task.FromResult(respond(request));
    }
}
