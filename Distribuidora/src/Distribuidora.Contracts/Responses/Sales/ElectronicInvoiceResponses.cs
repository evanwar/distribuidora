namespace Distribuidora.Contracts.Responses;

public sealed record ElectronicInvoiceResponse(Guid Id, Guid SaleId, string Provider, string Status, string? ProviderInvoiceId, string? FiscalUuid, DateTimeOffset? IssuedAt, DateTimeOffset? CancelledAt, string? CancellationReasonCode, string? ErrorCode, string? ErrorMessage);
public sealed record SaleBillingEligibilityResponse(
    bool Eligible,
    string ReasonCode,
    string RequiredAction,
    Guid SaleId,
    string SaleStatus,
    Guid? BillingCustomerId,
    string FiscalCoverageStatus,
    string? ElectronicInvoiceStatus,
    uint RowVersion);

public sealed record SaleBillingRecipientResponse(
    Guid Id,
    Guid SaleId,
    Guid CustomerId,
    string Status,
    string Reason,
    DateTimeOffset AssignedAt,
    Guid AssignedBy,
    uint RowVersion);

public sealed record SaleFiscalStatusResponse(
    Guid SaleId,
    string CoverageStatus,
    string? GlobalInvoiceFiscalUuid,
    string? ReconciliationReason,
    Guid? BillingCustomerId,
    string? ElectronicInvoiceStatus,
    uint RowVersion);
