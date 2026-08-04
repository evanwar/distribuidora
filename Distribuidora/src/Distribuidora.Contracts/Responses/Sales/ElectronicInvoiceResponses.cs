namespace Distribuidora.Contracts.Responses;

public sealed record ElectronicInvoiceResponse(Guid Id, Guid SaleId, string Provider, string Status, string? ProviderInvoiceId, string? FiscalUuid, DateTimeOffset? IssuedAt, DateTimeOffset? CancelledAt, string? CancellationReasonCode, string? ErrorCode, string? ErrorMessage);
