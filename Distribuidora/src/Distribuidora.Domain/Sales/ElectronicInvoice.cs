using Distribuidora.Domain.Common;

namespace Distribuidora.Domain.Sales;

public enum ElectronicInvoiceStatus { Pending, Issued, Failed, Cancelled }
public enum FiscalCoverageStatus
{
    Uncovered,
    ReservedForNominativeInvoice,
    IncludedInOpenGlobalInvoice,
    IncludedInIssuedGlobalInvoice,
    GlobalInvoiceCancellationPending,
    GlobalInvoiceCancelled,
    NominativeInvoicePending,
    NominativeInvoiceIssued,
    ReconciliationRequired
}

public enum BillingRecipientStatus { Assigned, Replaced, Locked, Cancelled }

public sealed class SaleFiscalStatus : AuditableEntity
{
    public Guid SaleId { get; set; }
    public FiscalCoverageStatus CoverageStatus { get; private set; } = FiscalCoverageStatus.Uncovered;
    public string? GlobalInvoiceFiscalUuid { get; private set; }
    public string? ReconciliationReason { get; private set; }

    public void ReserveForNominativeInvoice(DateTimeOffset occurredAt)
    {
        if (CoverageStatus is not (FiscalCoverageStatus.Uncovered or FiscalCoverageStatus.ReservedForNominativeInvoice))
            throw new DomainRuleException("The sale is not available for a nominative invoice.");
        CoverageStatus = FiscalCoverageStatus.ReservedForNominativeInvoice;
        Raise(new EntityChangedDomainEvent("SaleReservedForNominativeInvoice", nameof(SaleFiscalStatus), Id, occurredAt));
    }

    public void MarkNominativeInvoicePending(DateTimeOffset occurredAt)
    {
        if (CoverageStatus != FiscalCoverageStatus.ReservedForNominativeInvoice)
            throw new DomainRuleException("The sale must be reserved before invoicing.");
        CoverageStatus = FiscalCoverageStatus.NominativeInvoicePending;
        Raise(new EntityChangedDomainEvent("NominativeInvoiceRequested", nameof(SaleFiscalStatus), Id, occurredAt));
    }

    public void MarkNominativeInvoiceIssued(DateTimeOffset occurredAt)
    {
        if (CoverageStatus != FiscalCoverageStatus.NominativeInvoicePending)
            throw new DomainRuleException("A pending nominative invoice is required.");
        CoverageStatus = FiscalCoverageStatus.NominativeInvoiceIssued;
        Raise(new EntityChangedDomainEvent("NominativeInvoiceIssued", nameof(SaleFiscalStatus), Id, occurredAt));
    }

    public void RequireReconciliation(string reason, DateTimeOffset occurredAt)
    {
        CoverageStatus = FiscalCoverageStatus.ReconciliationRequired;
        ReconciliationReason = reason;
        Raise(new EntityChangedDomainEvent("SaleFiscalReconciliationRequired", nameof(SaleFiscalStatus), Id, occurredAt));
    }

    public void Reconcile(FiscalCoverageStatus status, string reason, string? globalInvoiceFiscalUuid, DateTimeOffset occurredAt)
    {
        if (status is not (FiscalCoverageStatus.Uncovered or FiscalCoverageStatus.IncludedInOpenGlobalInvoice or FiscalCoverageStatus.IncludedInIssuedGlobalInvoice))
            throw new DomainRuleException("The requested fiscal coverage status cannot be assigned by reconciliation.");
        if (string.IsNullOrWhiteSpace(reason)) throw new DomainRuleException("A reconciliation reason is required.");
        if (status == FiscalCoverageStatus.IncludedInIssuedGlobalInvoice && string.IsNullOrWhiteSpace(globalInvoiceFiscalUuid))
            throw new DomainRuleException("The global invoice fiscal UUID is required.");
        CoverageStatus = status;
        GlobalInvoiceFiscalUuid = globalInvoiceFiscalUuid;
        ReconciliationReason = reason.Trim();
        Raise(new EntityChangedDomainEvent("SaleFiscalCoverageReconciled", nameof(SaleFiscalStatus), Id, occurredAt));
    }
}

public sealed class SaleBillingRecipient : AuditableEntity
{
    public Guid SaleId { get; set; }
    public Guid CustomerId { get; private set; }
    public BillingRecipientStatus Status { get; private set; } = BillingRecipientStatus.Assigned;
    public string Reason { get; private set; } = "";
    public DateTimeOffset AssignedAt { get; private set; }
    public Guid AssignedBy { get; private set; }

    public void Assign(Guid customerId, string reason, Guid actorId, DateTimeOffset occurredAt)
    {
        if (customerId == Guid.Empty) throw new DomainRuleException("A billing customer is required.");
        if (string.IsNullOrWhiteSpace(reason)) throw new DomainRuleException("An assignment reason is required.");
        if (Status == BillingRecipientStatus.Locked) throw new DomainRuleException("The billing recipient is locked by an invoice attempt.");
        Status = AssignedAt == default ? BillingRecipientStatus.Assigned : BillingRecipientStatus.Replaced;
        CustomerId = customerId;
        Reason = reason.Trim();
        AssignedAt = occurredAt;
        AssignedBy = actorId;
        Raise(new EntityChangedDomainEvent("SaleBillingRecipientAssigned", nameof(SaleBillingRecipient), Id, occurredAt));
    }

    public void Lock(DateTimeOffset occurredAt)
    {
        if (Status is not (BillingRecipientStatus.Assigned or BillingRecipientStatus.Replaced))
            throw new DomainRuleException("The billing recipient cannot be locked.");
        Status = BillingRecipientStatus.Locked;
        Raise(new EntityChangedDomainEvent("SaleBillingRecipientLocked", nameof(SaleBillingRecipient), Id, occurredAt));
    }
}

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
    public Guid? BillingCustomerId { get; set; }
    public string RecipientTaxId { get; set; } = "";
    public string RecipientLegalName { get; set; } = "";
    public string RecipientFiscalZipCode { get; set; } = "";
    public string RecipientTaxRegimeCode { get; set; } = "";
    public string CfdiUseCode { get; set; } = "";
    public string PaymentFormCode { get; set; } = "";
    public string PaymentMethodCode { get; set; } = "";
    public string CurrencyCode { get; set; } = "MXN";
    public string ExpeditionZipCode { get; set; } = "";

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
