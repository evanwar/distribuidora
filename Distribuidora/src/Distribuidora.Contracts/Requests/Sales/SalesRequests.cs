namespace Distribuidora.Contracts.Requests;

public enum PaymentCondition { Cash, Credit, Mixed }

public sealed record SaleItemRequest(Guid ProductId, decimal Quantity, decimal UnitPrice, decimal Discount);
public sealed record SalePaymentRequest(string Method, decimal Amount, string? Reference);
public sealed record CreateSaleRequest(Guid? CustomerId, Guid SourceWarehouseId, PaymentCondition PaymentCondition, decimal TaxTotal, string? Notes, IReadOnlyCollection<SaleItemRequest> Items, IReadOnlyCollection<SalePaymentRequest>? Payments);
