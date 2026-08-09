using Distribuidora.Domain.Common;

namespace Distribuidora.Domain.Administration;

public static class PaymentMethodCodes
{
    public const string Cash = "cash";
    public const string Card = "card";
    public const string BankTransfer = "transfer";
}

public static class PaymentTerminalProviders
{
    public const string MercadoPago = "mercado_pago";
}

public sealed class PaymentTerminal : AuditableEntity
{
    public const int NameMaximumLength = 120;
    public const int ExternalIdMaximumLength = 150;
    public const int DescriptionMaximumLength = 500;

    public string Name { get; set; } = "";
    public string Provider { get; set; } = PaymentTerminalProviders.MercadoPago;
    public string ExternalId { get; set; } = "";
    public string? Description { get; set; }
    public bool IsDefault { get; set; }
    public bool Active { get; set; } = true;

    public void RecordCreated(DateTimeOffset occurredAt) =>
        Raise(new EntityChangedDomainEvent("PaymentTerminalCreated", nameof(PaymentTerminal), Id, occurredAt));

    public void RecordUpdated(DateTimeOffset occurredAt) =>
        Raise(new EntityChangedDomainEvent("PaymentTerminalUpdated", nameof(PaymentTerminal), Id, occurredAt));

    public void Activate(DateTimeOffset occurredAt)
    {
        if (Active) return;
        Active = true;
        Raise(new EntityChangedDomainEvent("PaymentTerminalActivated", nameof(PaymentTerminal), Id, occurredAt));
    }

    public void Deactivate(DateTimeOffset occurredAt)
    {
        if (!Active) return;
        Active = false;
        IsDefault = false;
        Raise(new EntityChangedDomainEvent("PaymentTerminalDeactivated", nameof(PaymentTerminal), Id, occurredAt));
    }
}

public static class DocumentFolioTypes
{
    public const string Purchase = "purchase";
    public const string PurchasePrefix = "PO-";
    public const string GoodsReceipt = "goods_receipt";
    public const string GoodsReceiptPrefix = "GR-";
    public const string InventoryAdjustment = "inventory_adjustment";
    public const string InventoryAdjustmentPrefix = "ADJ-";
    public const string CounterSale = "counter_sale";
    public const string CounterSalePrefix = "CS-";
    public const int DefaultPadding = 8;
}

public sealed class SystemSetting : AuditableEntity
{
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
    public string DataType { get; set; } = "string";
    public string? Description { get; set; }
    public string Module { get; set; } = "";
}

public sealed class FolioSequence : AuditableEntity
{
    public const int MinimumPadding = 1;
    public const int MaximumPadding = 20;

    public string DocumentType { get; set; } = "";
    public string Prefix { get; set; } = "";
    public long CurrentNumber { get; private set; }
    public int Padding { get; set; } = 6;
    public bool Active { get; set; } = true;

    public string Next()
    {
        if (!Active) throw new DomainRuleException("Folio sequence is inactive.");
        CurrentNumber++;
        return $"{Prefix}{CurrentNumber.ToString().PadLeft(Padding, '0')}";
    }

    public void SetCurrentNumber(long value)
    {
        if (value < CurrentNumber) throw new DomainRuleException("Folio number cannot move backwards.");
        CurrentNumber = value;
    }
}

public sealed class PaymentMethod : AuditableEntity
{
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public bool RequiresReference { get; set; }
    public bool Active { get; set; } = true;
}

public sealed class CreditPolicy : AuditableEntity
{
    public const int DefaultDueDaysValue = 30;

    public bool AllowCreditSales { get; set; } = true;
    public int DefaultDueDays { get; set; } = DefaultDueDaysValue;
    public bool RequireAuthorizationOverLimit { get; set; } = true;
    public bool Active { get; set; } = true;
}

public sealed class InventoryPolicy : AuditableEntity
{
    public bool AllowNegativeStock { get; set; }
    public bool RequireReasonForAdjustment { get; set; } = true;
    public bool Active { get; set; } = true;
}
