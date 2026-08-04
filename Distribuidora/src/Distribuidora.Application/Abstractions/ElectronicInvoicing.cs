namespace Distribuidora.Application.Abstractions;

public sealed record ElectronicInvoiceRecipient(string TaxId, string LegalName, string ZipCode, string TaxRegimeCode, string CfdiUseCode, string? Email);
public sealed record ElectronicInvoiceTax(string TaxCode, string TaxTypeCode, decimal Rate, string TaxFlagCode);
public sealed record ElectronicInvoiceLine(string SatProductCode, string SatUnitCode, string Description, string? Sku, decimal Quantity, decimal UnitPrice, decimal Discount, string TaxObjectCode, IReadOnlyCollection<ElectronicInvoiceTax> Taxes);
public sealed record IssueElectronicInvoiceModel(string Series, string Number, DateTimeOffset Date, string PaymentFormCode, string PaymentMethodCode, string CurrencyCode, string ExpeditionZipCode, string IssuerProviderId, ElectronicInvoiceRecipient Recipient, IReadOnlyCollection<ElectronicInvoiceLine> Lines);
public sealed record ProviderInvoiceResult(string ProviderInvoiceId, string FiscalUuid);
public sealed record ProviderFile(string FileName, string ContentType, byte[] Content);

public interface IElectronicInvoicingProvider
{
    string Name { get; }
    Task<ProviderInvoiceResult> IssueAsync(IssueElectronicInvoiceModel invoice, CancellationToken cancellationToken);
    Task<ProviderFile> DownloadXmlAsync(string providerInvoiceId, CancellationToken cancellationToken);
    Task<ProviderFile> DownloadPdfAsync(string providerInvoiceId, CancellationToken cancellationToken);
    Task CancelAsync(string providerInvoiceId, string fiscalUuid, string reasonCode, string? replacementUuid, CancellationToken cancellationToken);
}

public interface IElectronicInvoicingProfile
{
    string IssuerProviderId { get; }
    string ExpeditionZipCode { get; }
    string Series { get; }
}

public sealed class ElectronicInvoicingProviderException(string message, string? code = null, bool outcomeUnknown = false, Exception? innerException = null)
    : Exception(message, innerException)
{
    public string? Code { get; } = code;
    public bool OutcomeUnknown { get; } = outcomeUnknown;
}
