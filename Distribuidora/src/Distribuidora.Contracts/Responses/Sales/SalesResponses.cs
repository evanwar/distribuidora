namespace Distribuidora.Contracts.Responses;

public sealed record SaleItemResponse(Guid Id, Guid ProductId, decimal Quantity, decimal UnitPrice, decimal Discount, decimal Total, decimal HistoricalUnitCost);
public sealed record SalePaymentResponse(Guid Id, DateTimeOffset PaymentDate, string Method, decimal Amount, string? Reference, Guid ReceivedBy);
public sealed record SaleCancellationResponse(string Reason, Guid CancelledBy, DateTimeOffset CancelledAt, bool InventoryReverted, bool PaymentsReverted);
public sealed record CounterSaleResponse(Guid Id, string Folio, DateTimeOffset SaleDate, Guid? CustomerId, Guid SourceWarehouseId, string Status, string PaymentCondition, decimal Subtotal, decimal DiscountTotal, decimal TaxTotal, decimal Total, decimal PaidAmount, decimal Balance, string? Notes, IReadOnlyCollection<SaleItemResponse> Items, IReadOnlyCollection<SalePaymentResponse> Payments, SaleCancellationResponse? Cancellation);
public sealed record PointCardPaymentResponse(
    Guid Id,
    Guid SaleId,
    string? OrderId,
    decimal Amount,
    string Status,
    string StatusDetail,
    string? PaymentId,
    string? PaymentMethodType,
    string? PaymentMethodId,
    int? Installments,
    DateTimeOffset? CompletedAt);
