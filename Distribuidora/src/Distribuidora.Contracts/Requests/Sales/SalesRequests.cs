using System.Text.Json.Serialization;

namespace Distribuidora.Contracts.Requests;

public enum PaymentCondition { Cash, Credit, Mixed }

public sealed record SaleItemRequest(Guid ProductId, decimal Quantity, decimal UnitPrice, decimal Discount);
public sealed record SalePaymentRequest(string Method, decimal Amount, string? Reference);
public sealed record CreateSaleRequest(Guid? CustomerId, Guid SourceWarehouseId, PaymentCondition PaymentCondition, decimal TaxTotal, string? Notes, IReadOnlyCollection<SaleItemRequest> Items, IReadOnlyCollection<SalePaymentRequest>? Payments);
public sealed record StartPointCardPaymentRequest(decimal Amount, Guid? PaymentTerminalId = null);
public sealed record MercadoPagoWebhookRequest(
    string? Action,
    string? Type,
    [property: JsonPropertyName("application_id")] string? ApplicationId,
    MercadoPagoWebhookData? Data);
public sealed record MercadoPagoWebhookData(
    string? Id,
    [property: JsonPropertyName("external_reference")] string? ExternalReference,
    string? Status,
    [property: JsonPropertyName("status_detail")] string? StatusDetail);
