using Distribuidora.Domain.Common;

namespace Distribuidora.Domain.Purchases;

public sealed class PurchaseOrder : AuditableEntity
{
    public string Folio { get; set; } = "";
    public Guid SupplierId { get; set; }
    public DateTimeOffset Date { get; set; }
    public DocumentStatus Status { get; private set; } = DocumentStatus.Draft;
    public decimal Subtotal { get; private set; }
    public decimal Tax { get; set; }
    public decimal Total { get; private set; }
    public string? Notes { get; set; }
    public string? CancelReason { get; private set; }
    public ICollection<PurchaseOrderItem> Items { get; set; } = [];

    public void Recalculate()
    {
        Subtotal = Items.Sum(x => x.Quantity * x.UnitCost - x.Discount);
        Total = Subtotal + Tax;
    }

    public void Confirm(DateTimeOffset occurredAt)
    {
        if (Status != DocumentStatus.Draft || Items.Count == 0) throw new DomainRuleException("Only a non-empty draft purchase can be confirmed.");
        Recalculate();
        Status = DocumentStatus.Confirmed;
        Raise(new EntityChangedDomainEvent("PurchaseOrderConfirmed", nameof(PurchaseOrder), Id, occurredAt));
    }

    public void Cancel(string reason)
    {
        if (string.IsNullOrWhiteSpace(reason)) throw new DomainRuleException("Cancellation reason is required.");
        Status = DocumentStatus.Cancelled;
        CancelReason = reason;
    }
}

public sealed class PurchaseOrderItem : Entity
{
    public Guid PurchaseOrderId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal Discount { get; set; }
    public decimal Total => Quantity * UnitCost - Discount;
}

public sealed class GoodsReceipt : AuditableEntity
{
    public string Folio { get; set; } = "";
    public Guid? PurchaseOrderId { get; set; }
    public Guid SupplierId { get; set; }
    public Guid DestinationWarehouseId { get; set; }
    public DateTimeOffset ReceivedAt { get; set; }
    public Guid ReceivedBy { get; set; }
    public DocumentStatus Status { get; private set; } = DocumentStatus.Draft;
    public string? Notes { get; set; }
    public string? CancelReason { get; private set; }
    public ICollection<GoodsReceiptItem> Items { get; set; } = [];

    public void Close(DateTimeOffset occurredAt)
    {
        if (Status != DocumentStatus.Draft || Items.Count == 0) throw new DomainRuleException("Only a non-empty draft receipt can be closed.");
        Status = DocumentStatus.Closed;
        Raise(new EntityChangedDomainEvent("GoodsReceiptClosed", nameof(GoodsReceipt), Id, occurredAt));
    }

    public void Cancel(string reason)
    {
        if (string.IsNullOrWhiteSpace(reason)) throw new DomainRuleException("Cancellation reason is required.");
        Status = DocumentStatus.Cancelled;
        CancelReason = reason;
    }
}

public sealed class GoodsReceiptItem : Entity
{
    public Guid GoodsReceiptId { get; set; }
    public Guid ProductId { get; set; }
    public decimal ReceivedQuantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal Total => ReceivedQuantity * UnitCost;
}
