using Distribuidora.Domain.Common;

namespace Distribuidora.Domain.Sales;

public enum ElectronicInvoiceStatus { Pending, Issued, Failed, Cancelled }

public sealed class ElectronicInvoice : AuditableEntity
{
    public Guid SaleId { get; set; }
    public string Provider { get; set; } = "";
    public string IdempotencyKey { get; set; } = "";
    public ElectronicInvoiceStatus Status { get; private set; } = ElectronicInvoiceStatus.Pending;
    public string? ProviderInvoiceId { get; private set; }
    public string? FiscalUuid { get; private set; }
    public DateTimeOffset? IssuedAt { get; private set; }
    public DateTimeOffset? CancelledAt { get; private set; }
    public string? CancellationReasonCode { get; private set; }
    public string? ErrorCode { get; private set; }
    public string? ErrorMessage { get; private set; }

    public void MarkIssued(string providerInvoiceId, string fiscalUuid, DateTimeOffset issuedAt)
    {
        if (Status != ElectronicInvoiceStatus.Pending) throw new DomainRuleException("Only a pending electronic invoice can be issued.");
        ProviderInvoiceId = providerInvoiceId;
        FiscalUuid = fiscalUuid;
        IssuedAt = issuedAt;
        Status = ElectronicInvoiceStatus.Issued;
        ErrorCode = ErrorMessage = null;
    }

    public void MarkFailed(string? errorCode, string errorMessage)
    {
        if (Status != ElectronicInvoiceStatus.Pending) throw new DomainRuleException("Only a pending electronic invoice can fail.");
        ErrorCode = errorCode;
        ErrorMessage = errorMessage;
        Status = ElectronicInvoiceStatus.Failed;
    }

    public void MarkCancelled(string reasonCode, DateTimeOffset cancelledAt)
    {
        if (Status != ElectronicInvoiceStatus.Issued) throw new DomainRuleException("Only an issued electronic invoice can be cancelled.");
        CancellationReasonCode = reasonCode;
        CancelledAt = cancelledAt;
        Status = ElectronicInvoiceStatus.Cancelled;
    }
}
