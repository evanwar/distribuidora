using Distribuidora.Domain.Common;

namespace Distribuidora.Domain.Inventory;

public enum MovementType
{
    PurchaseReceipt,
    CounterSale,
    SaleCancellation,
    Adjustment,
    InternalTransfer,
    ManualCorrection,
    AdjustmentCancellation
}

public sealed class StockBalance : AuditableEntity
{
    public Guid WarehouseId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Quantity { get; private set; }
    public decimal ReservedQuantity { get; private set; }

    public void Apply(decimal delta, bool allowNegativeStock, DateTimeOffset occurredAt)
    {
        var next = Quantity + delta;
        if (next < ReservedQuantity && !allowNegativeStock)
            throw new DomainRuleException("Insufficient available stock.");
        Quantity = next;
        UpdatedAt = occurredAt;
        Raise(new EntityChangedDomainEvent("StockBalanceChanged", nameof(StockBalance), Id, occurredAt));
    }
}

public sealed class InventoryMovement : AuditableEntity
{
    public string OperationId { get; set; } = "";
    public string CorrelationId { get; set; } = "";
    public string TransactionId { get; set; } = "";
    public string Folio { get; set; } = "";
    public DateTimeOffset Date { get; set; }
    public MovementType MovementType { get; set; }
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public Guid? SourceWarehouseId { get; set; }
    public Guid? DestinationWarehouseId { get; set; }
    public decimal UnitCost { get; set; }
    public string ReferenceType { get; set; } = "";
    public Guid ReferenceId { get; set; }
    public string? Notes { get; set; }
    public decimal ResultingBalance { get; set; }
}

public sealed class InventoryAdjustment : AuditableEntity
{
    public string Folio { get; set; } = "";
    public Guid WarehouseId { get; set; }
    public string Reason { get; set; } = "";
    public DocumentStatus Status { get; private set; } = DocumentStatus.Draft;
    public Guid? AuthorizedBy { get; set; }
    public DateTimeOffset? ConfirmedAt { get; private set; }
    public DateTimeOffset? CancelledAt { get; private set; }
    public string? CancelReason { get; private set; }
    public ICollection<InventoryAdjustmentItem> Items { get; set; } = [];

    public void Confirm(DateTimeOffset occurredAt)
    {
        if (Status != DocumentStatus.Draft) throw new DomainRuleException("Only draft adjustments can be confirmed.");
        if (Items.Count == 0) throw new DomainRuleException("An adjustment requires at least one item.");
        if (string.IsNullOrWhiteSpace(Reason)) throw new DomainRuleException("Adjustment reason is required.");
        Status = DocumentStatus.Confirmed;
        ConfirmedAt = occurredAt;
        Raise(new EntityChangedDomainEvent("InventoryAdjustmentConfirmed", nameof(InventoryAdjustment), Id, occurredAt));
    }

    public void Cancel(string reason, DateTimeOffset occurredAt)
    {
        if (string.IsNullOrWhiteSpace(reason)) throw new DomainRuleException("Cancellation reason is required.");
        if (Status == DocumentStatus.Cancelled) throw new DomainRuleException("Adjustment is already cancelled.");
        Status = DocumentStatus.Cancelled;
        CancelReason = reason;
        CancelledAt = occurredAt;
        Raise(new EntityChangedDomainEvent("InventoryAdjustmentCancelled", nameof(InventoryAdjustment), Id, occurredAt));
    }
}

public sealed class InventoryAdjustmentItem : Entity
{
    public Guid InventoryAdjustmentId { get; set; }
    public Guid ProductId { get; set; }
    public decimal SystemQuantity { get; set; }
    public decimal PhysicalQuantity { get; set; }
    public decimal DifferenceQuantity => PhysicalQuantity - SystemQuantity;
    public decimal UnitCost { get; set; }
}
