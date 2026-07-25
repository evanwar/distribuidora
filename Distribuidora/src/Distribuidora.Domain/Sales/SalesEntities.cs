using Distribuidora.Domain.Common;

namespace Distribuidora.Domain.Sales;

public sealed class CounterSale : AuditableEntity
{
    public string Folio { get; set; } = "";
    public DateTimeOffset SaleDate { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid SourceWarehouseId { get; set; }
    public DocumentStatus Status { get; private set; } = DocumentStatus.Draft;
    public PaymentCondition PaymentCondition { get; set; }
    public decimal Subtotal { get; private set; }
    public decimal DiscountTotal { get; private set; }
    public decimal TaxTotal { get; set; }
    public decimal Total { get; private set; }
    public decimal PaidAmount { get; private set; }
    public decimal Balance { get; private set; }
    public string? Notes { get; set; }
    public ICollection<CounterSaleItem> Items { get; set; } = [];
    public ICollection<SalePayment> Payments { get; set; } = [];
    public SaleCancellation? Cancellation { get; set; }

    public void Recalculate()
    {
        Subtotal = Items.Sum(x => x.Quantity * x.UnitPrice);
        DiscountTotal = Items.Sum(x => x.Discount);
        Total = Subtotal - DiscountTotal + TaxTotal;
        PaidAmount = Payments.Sum(x => x.Amount);
        Balance = Total - PaidAmount;
    }

    public void Confirm(DateTimeOffset occurredAt)
    {
        if (Status != DocumentStatus.Draft || Items.Count == 0) throw new DomainRuleException("Only a non-empty draft sale can be confirmed.");
        Recalculate();
        if (PaymentCondition == PaymentCondition.Cash && Balance != 0) throw new DomainRuleException("Cash sales require full payment.");
        if (PaymentCondition != PaymentCondition.Cash && CustomerId is null) throw new DomainRuleException("Credit and mixed sales require a customer.");
        if (Balance < 0) throw new DomainRuleException("Payments cannot exceed sale total.");
        Status = DocumentStatus.Confirmed;
        Raise(new EntityChangedDomainEvent("CounterSaleConfirmed", nameof(CounterSale), Id, occurredAt));
    }

    public void RegisterPayment(SalePayment payment, DateTimeOffset occurredAt)
    {
        if (Status == DocumentStatus.Cancelled) throw new DomainRuleException("Cannot pay a cancelled sale.");
        if (payment.Amount <= 0) throw new DomainRuleException("Payment amount must be positive.");
        Recalculate();
        if (payment.Amount > Balance) throw new DomainRuleException("Payment exceeds outstanding balance.");
        Payments.Add(payment);
        Recalculate();
        Raise(new EntityChangedDomainEvent("SalePaymentRegistered", nameof(CounterSale), Id, occurredAt));
    }

    public void Cancel(string reason, Guid userId, DateTimeOffset occurredAt)
    {
        if (Status != DocumentStatus.Confirmed) throw new DomainRuleException("Only confirmed sales can be cancelled.");
        if (string.IsNullOrWhiteSpace(reason)) throw new DomainRuleException("Cancellation reason is required.");
        Status = DocumentStatus.Cancelled;
        Cancellation = new SaleCancellation
        {
            SaleId = Id, Reason = reason, CancelledBy = userId, CancelledAt = occurredAt
        };
        Raise(new EntityChangedDomainEvent("CounterSaleCancelled", nameof(CounterSale), Id, occurredAt));
    }
}

public sealed class CounterSaleItem : Entity
{
    public Guid SaleId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public decimal Total => Quantity * UnitPrice - Discount;
    public decimal HistoricalUnitCost { get; set; }
}

public sealed class SalePayment : Entity
{
    public Guid SaleId { get; set; }
    public DateTimeOffset PaymentDate { get; set; }
    public string Method { get; set; } = "";
    public decimal Amount { get; set; }
    public string? Reference { get; set; }
    public Guid ReceivedBy { get; set; }
}

public sealed class SaleCancellation : Entity
{
    public Guid SaleId { get; set; }
    public string Reason { get; set; } = "";
    public Guid CancelledBy { get; set; }
    public DateTimeOffset CancelledAt { get; set; }
    public bool InventoryReverted { get; set; }
    public bool PaymentsReverted { get; set; }
}
