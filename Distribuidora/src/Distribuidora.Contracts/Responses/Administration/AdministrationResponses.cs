namespace Distribuidora.Contracts.Responses;

public sealed record SystemSettingResponse(Guid Id, string Key, string Value, string DataType, string? Description, string Module, Guid? UpdatedBy, DateTimeOffset? UpdatedAt);
public sealed record FolioSequenceResponse(Guid Id, string DocumentType, string Prefix, long CurrentNumber, int Padding, bool Active);
public sealed record PaymentMethodResponse(Guid Id, string Code, string Name, bool RequiresReference, bool Active);
public sealed record CreditPolicyResponse(Guid Id, bool AllowCreditSales, int DefaultDueDays, bool RequireAuthorizationOverLimit, bool Active);
public sealed record InventoryPolicyResponse(Guid Id, bool AllowNegativeStock, bool RequireReasonForAdjustment, bool Active);
