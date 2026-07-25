namespace Distribuidora.Contracts.Requests;

public sealed record CustomerPaymentRequest(Guid CustomerId, string Method, decimal Amount, string? Reference);
public sealed record AllocationItemRequest(Guid AccountReceivableId, decimal Amount);
public sealed record ApplyPaymentRequest(IReadOnlyCollection<AllocationItemRequest> Allocations);
public sealed record ChangeCreditLimitRequest(decimal NewLimit, string Reason);
