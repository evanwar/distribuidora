namespace Distribuidora.Contracts.Requests;

public sealed record UpdateSettingRequest(string Value, string DataType, string? Description, string Module);
public sealed record FolioSequenceRequest(string DocumentType, string Prefix, long CurrentNumber, int Padding, bool Active = true);
public sealed record PaymentMethodRequest(string Code, string Name, bool RequiresReference, bool Active = true);
public sealed record PaymentTerminalRequest(
    string Name,
    string ExternalId,
    string? Description,
    bool IsDefault = false,
    bool Active = true,
    uint? RowVersion = null);
public sealed record CreditPolicyRequest(bool AllowCreditSales, int DefaultDueDays, bool RequireAuthorizationOverLimit, bool Active = true);
public sealed record InventoryPolicyRequest(bool AllowNegativeStock, bool RequireReasonForAdjustment, bool Active = true);
