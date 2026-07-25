namespace Distribuidora.Contracts.Responses;

public sealed record PaymentAllocationResponse(Guid Id, Guid CustomerPaymentId, Guid AccountReceivableId, decimal AmountApplied, bool Reversed);
public sealed record AccountReceivableResponse(Guid Id, Guid CustomerId, Guid SaleId, DateTimeOffset IssueDate, DateTimeOffset DueDate, decimal Total, decimal Balance, string Status, IReadOnlyCollection<PaymentAllocationResponse> Allocations);
public sealed record CustomerPaymentResponse(Guid Id, Guid CustomerId, DateTimeOffset PaymentDate, string Method, decimal Amount, string? Reference, Guid ReceivedBy, string Status, string? CancelReason, decimal AvailableAmount, IReadOnlyCollection<PaymentAllocationResponse> Allocations);
public sealed record CustomerStatementResponse(Guid CustomerId, IReadOnlyCollection<AccountReceivableResponse> Receivables, IReadOnlyCollection<CustomerPaymentResponse> Payments, decimal Balance);
