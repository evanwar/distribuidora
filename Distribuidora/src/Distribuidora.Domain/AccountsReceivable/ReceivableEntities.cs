using Distribuidora.Domain.Common;

namespace Distribuidora.Domain.AccountsReceivable;

public sealed class AccountReceivable : AuditableEntity
{
    public Guid CustomerId { get; set; }
    public Guid SaleId { get; set; }
    public DateTimeOffset IssueDate { get; set; }
    public DateTimeOffset DueDate { get; set; }
    public decimal Total { get; set; }
    public decimal Balance { get; private set; }
    public ReceivableStatus Status { get; private set; } = ReceivableStatus.Pending;
    public ICollection<PaymentAllocation> Allocations { get; set; } = [];

    public void InitializeBalance() => Balance = Total;

    public void Apply(decimal amount, DateTimeOffset occurredAt)
    {
        if (amount <= 0 || amount > Balance) throw new DomainRuleException("Applied amount must be positive and cannot exceed balance.");
        Balance -= amount;
        Status = Balance == 0 ? ReceivableStatus.Paid : ReceivableStatus.PartiallyPaid;
        Raise(new EntityChangedDomainEvent("PaymentAllocated", nameof(AccountReceivable), Id, occurredAt));
    }

    public void Reverse(decimal amount)
    {
        Balance += amount;
        if (Balance > Total) throw new DomainRuleException("Reversal exceeds receivable total.");
        Status = Balance == Total ? ReceivableStatus.Pending : ReceivableStatus.PartiallyPaid;
    }
}

public sealed class CustomerPayment : AuditableEntity
{
    public Guid CustomerId { get; set; }
    public DateTimeOffset PaymentDate { get; set; }
    public string Method { get; set; } = "";
    public decimal Amount { get; set; }
    public string? Reference { get; set; }
    public Guid ReceivedBy { get; set; }
    public DocumentStatus Status { get; private set; } = DocumentStatus.Confirmed;
    public string? CancelReason { get; private set; }
    public ICollection<PaymentAllocation> Allocations { get; set; } = [];

    public decimal AvailableAmount => Amount - Allocations.Where(x => !x.Reversed).Sum(x => x.AmountApplied);

    public void Cancel(string reason)
    {
        if (string.IsNullOrWhiteSpace(reason)) throw new DomainRuleException("Cancellation reason is required.");
        if (Status == DocumentStatus.Cancelled) throw new DomainRuleException("Payment is already cancelled.");
        Status = DocumentStatus.Cancelled;
        CancelReason = reason;
    }
}

public sealed class PaymentAllocation : Entity
{
    public Guid CustomerPaymentId { get; set; }
    public Guid AccountReceivableId { get; set; }
    public decimal AmountApplied { get; set; }
    public bool Reversed { get; set; }
}

public sealed class CreditLimitHistory : Entity
{
    public Guid CustomerId { get; set; }
    public decimal PreviousLimit { get; set; }
    public decimal NewLimit { get; set; }
    public Guid AuthorizedBy { get; set; }
    public string Reason { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; }
}
