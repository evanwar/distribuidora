using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;
using Distribuidora.Application.Abstractions;
using Microsoft.Extensions.Options;

namespace Distribuidora.Infrastructure.Payments;

public sealed class MercadoPagoPointOptions
{
    public const string SectionName = "MercadoPago:Point";
    public string BaseUrl { get; set; } = "https://api.mercadopago.com";
    public string AccessToken { get; set; } = "";
    public string WebhookSecret { get; set; } = "";
    public string ApplicationId { get; set; } = "";
    public string TerminalId { get; set; } = "";
    public string ExpirationTime { get; set; } = "PT16M";
    public int WebhookToleranceSeconds { get; set; } = 300;
}

public sealed class MercadoPagoPointClient(HttpClient httpClient, IOptions<MercadoPagoPointOptions> options)
    : IMercadoPagoPointClient
{
    private readonly MercadoPagoPointOptions _options = options.Value;

    public async Task<MercadoPagoPointOrder> CreateOrderAsync(
        string externalReference,
        string idempotencyKey,
        decimal amount,
        string terminalId,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/v1/orders");
        Authorize(request);
        request.Headers.Add("X-Idempotency-Key", idempotencyKey);
        request.Content = JsonContent.Create(new
        {
            type = "point",
            external_reference = externalReference,
            expiration_time = _options.ExpirationTime,
            transactions = new { payments = new[] { new { amount = amount.ToString("0.00", CultureInfo.InvariantCulture) } } },
            config = new
            {
                point = new
                {
                    terminal_id = Required(terminalId, "Mercado Pago Point terminal"),
                    print_on_terminal = "no_ticket"
                },
                payment_method = new { default_type = "credit_card" }
            },
            description = "Distribuidora counter sale"
        });
        return await SendAsync(request, cancellationToken);
    }

    public async Task<MercadoPagoPointOrder> GetOrderAsync(string orderId, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/v1/orders/{Uri.EscapeDataString(orderId)}");
        Authorize(request);
        return await SendAsync(request, cancellationToken);
    }

    public async Task<MercadoPagoPointOrder> CancelOrderAsync(
        string orderId,
        string idempotencyKey,
        bool allowAtTerminal,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"/v1/orders/{Uri.EscapeDataString(orderId)}/cancel");
        Authorize(request);
        request.Headers.Add("X-Idempotency-Key", idempotencyKey);
        if (allowAtTerminal)
            request.Headers.Add("x-allow-cancelable-status", "at_terminal");
        return await SendAsync(request, cancellationToken);
    }

    private void Authorize(HttpRequestMessage request) =>
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", Required(_options.AccessToken, "Mercado Pago access token"));

    private async Task<MercadoPagoPointOrder> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        using var response = await httpClient.SendAsync(request, cancellationToken);
        var payload = await response.Content.ReadFromJsonAsync<OrderDto>(cancellationToken: cancellationToken);
        if (!response.IsSuccessStatusCode || payload is null)
            throw new HttpRequestException($"Mercado Pago rejected the Point request with status {(int)response.StatusCode}.", null, response.StatusCode);
        return new MercadoPagoPointOrder(
            payload.Id ?? "",
            payload.ExternalReference ?? "",
            payload.Status ?? "unknown",
            payload.StatusDetail ?? "unknown",
            Parse(payload.TotalPaidAmount),
            payload.Transactions?.Payments?.Select(x => new MercadoPagoPointTransaction(
                x.Id ?? "", Parse(x.Amount) ?? 0, Parse(x.PaidAmount), x.Status ?? "unknown",
                x.StatusDetail ?? "unknown", x.PaymentMethod?.Type, x.PaymentMethod?.Id,
                x.PaymentMethod?.Installments)).ToArray() ?? []);
    }

    private static decimal? Parse(string? value) =>
        decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out var amount) ? amount : null;

    private static string Required(string value, string name) =>
        !string.IsNullOrWhiteSpace(value) ? value : throw new InvalidOperationException($"{name} is not configured.");

    private sealed class OrderDto
    {
        [JsonPropertyName("id")] public string? Id { get; set; }
        [JsonPropertyName("external_reference")] public string? ExternalReference { get; set; }
        [JsonPropertyName("status")] public string? Status { get; set; }
        [JsonPropertyName("status_detail")] public string? StatusDetail { get; set; }
        [JsonPropertyName("total_paid_amount")] public string? TotalPaidAmount { get; set; }
        [JsonPropertyName("transactions")] public TransactionsDto? Transactions { get; set; }
    }

    private sealed class TransactionsDto
    {
        [JsonPropertyName("payments")] public PaymentDto[]? Payments { get; set; }
    }

    private sealed class PaymentDto
    {
        [JsonPropertyName("id")] public string? Id { get; set; }
        [JsonPropertyName("amount")] public string? Amount { get; set; }
        [JsonPropertyName("paid_amount")] public string? PaidAmount { get; set; }
        [JsonPropertyName("status")] public string? Status { get; set; }
        [JsonPropertyName("status_detail")] public string? StatusDetail { get; set; }
        [JsonPropertyName("payment_method")] public PaymentMethodDto? PaymentMethod { get; set; }
    }

    private sealed class PaymentMethodDto
    {
        [JsonPropertyName("type")] public string? Type { get; set; }
        [JsonPropertyName("id")] public string? Id { get; set; }
        [JsonPropertyName("installments")] public int? Installments { get; set; }
    }
}

public sealed class MercadoPagoWebhookValidator(IOptions<MercadoPagoPointOptions> options)
    : IMercadoPagoWebhookValidator
{
    private const int SignaturePairPartCount = 2;
    private const int UnixMillisecondsTimestampLength = 13;

    private readonly MercadoPagoPointOptions _options = options.Value;

    public bool IsExpectedApplication(string? applicationId) =>
        string.IsNullOrWhiteSpace(_options.ApplicationId) ||
        string.Equals(_options.ApplicationId, applicationId, StringComparison.Ordinal);

    public bool IsValid(string signature, string requestId, string dataId)
    {
        if (string.IsNullOrWhiteSpace(_options.WebhookSecret) || string.IsNullOrWhiteSpace(signature)) return false;
        string? timestamp = null;
        string? suppliedHash = null;
        foreach (var part in signature.Split(','))
        {
            var pair = part.Split('=', 2, StringSplitOptions.TrimEntries);
            if (pair.Length != SignaturePairPartCount) continue;
            if (pair[0] == "ts") timestamp = pair[1];
            if (pair[0] == "v1") suppliedHash = pair[1];
        }
        if (string.IsNullOrWhiteSpace(timestamp) || string.IsNullOrWhiteSpace(suppliedHash)) return false;
        if (!long.TryParse(timestamp, NumberStyles.None, CultureInfo.InvariantCulture, out var unixTimestamp)) return false;
        DateTimeOffset signedAt;
        try
        {
            signedAt = timestamp.Length >= UnixMillisecondsTimestampLength
                ? DateTimeOffset.FromUnixTimeMilliseconds(unixTimestamp)
                : DateTimeOffset.FromUnixTimeSeconds(unixTimestamp);
        }
        catch (ArgumentOutOfRangeException)
        {
            return false;
        }
        if (Math.Abs((DateTimeOffset.UtcNow - signedAt).TotalSeconds) > _options.WebhookToleranceSeconds) return false;
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(dataId)) parts.Add($"id:{dataId.ToLowerInvariant()}");
        if (!string.IsNullOrWhiteSpace(requestId)) parts.Add($"request-id:{requestId}");
        parts.Add($"ts:{timestamp}");
        var manifest = string.Join(';', parts) + ";";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_options.WebhookSecret));
        var computed = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(manifest))).ToLowerInvariant();
        return suppliedHash.Length == computed.Length && CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computed), Encoding.UTF8.GetBytes(suppliedHash.ToLowerInvariant()));
    }
}
