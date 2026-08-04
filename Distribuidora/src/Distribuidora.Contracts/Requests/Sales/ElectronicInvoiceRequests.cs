namespace Distribuidora.Contracts.Requests;

public sealed record ElectronicInvoiceRecipientRequest(string TaxId, string LegalName, string ZipCode, string TaxRegimeCode, string CfdiUseCode, string? Email);
public sealed record ElectronicInvoiceTaxRequest(string TaxCode, string TaxTypeCode, decimal Rate, string TaxFlagCode);
public sealed record ElectronicInvoiceItemRequest(Guid ProductId, string SatProductCode, string SatUnitCode, string TaxObjectCode, IReadOnlyCollection<ElectronicInvoiceTaxRequest> Taxes);
public sealed record IssueElectronicInvoiceRequest(string PaymentFormCode, ElectronicInvoiceRecipientRequest Recipient, IReadOnlyCollection<ElectronicInvoiceItemRequest> Items);
public sealed record CancelElectronicInvoiceRequest(string ReasonCode, string? ReplacementUuid);
