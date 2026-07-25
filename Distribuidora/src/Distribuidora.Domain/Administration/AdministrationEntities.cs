using Distribuidora.Domain.Common;

namespace Distribuidora.Domain.Administration;

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
    public bool AllowCreditSales { get; set; } = true;
    public int DefaultDueDays { get; set; } = 30;
    public bool RequireAuthorizationOverLimit { get; set; } = true;
    public bool Active { get; set; } = true;
}

public sealed class InventoryPolicy : AuditableEntity
{
    public bool AllowNegativeStock { get; set; }
    public bool RequireReasonForAdjustment { get; set; } = true;
    public bool Active { get; set; } = true;
}
