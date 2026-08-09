using Distribuidora.Application.Abstractions;
using Fiscalapi.Abstractions;
using Fiscalapi.Models;

namespace Distribuidora.Infrastructure.Invoicing;

public sealed class ElectronicInvoicingProfile(string issuerProviderId, string expeditionZipCode, string series) : IElectronicInvoicingProfile
{
    public string IssuerProviderId { get; } = issuerProviderId;
    public string ExpeditionZipCode { get; } = expeditionZipCode;
    public string Series { get; } = series;
}

public sealed class FiscalApiElectronicInvoicingProvider(IFiscalApiClient client) : IElectronicInvoicingProvider
{
    public const string ProviderName = "FiscalAPI";

    private const int UnknownHttpStatusCode = 0;
    private const int ServerErrorStatusCode = 500;

    public string Name => ProviderName;

    public async Task<ProviderInvoiceResult> IssueAsync(IssueElectronicInvoiceModel model, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        try
        {
            var response = await client.Invoices.CreateAsync(new Invoice
            {
                VersionCode = "4.0",
                Series = model.Series,
                Number = model.Number,
                Date = model.Date.LocalDateTime,
                PaymentFormCode = model.PaymentFormCode,
                PaymentMethodCode = model.PaymentMethodCode,
                CurrencyCode = model.CurrencyCode,
                TypeCode = "I",
                ExpeditionZipCode = model.ExpeditionZipCode,
                ExportCode = "01",
                Issuer = new InvoiceIssuer { Id = model.IssuerProviderId },
                Recipient = new InvoiceRecipient
                {
                    Tin = model.Recipient.TaxId,
                    LegalName = model.Recipient.LegalName,
                    ZipCode = model.Recipient.ZipCode,
                    TaxRegimeCode = model.Recipient.TaxRegimeCode,
                    CfdiUseCode = model.Recipient.CfdiUseCode,
                    Email = model.Recipient.Email
                },
                Items = model.Lines.Select(x => new InvoiceItem
                {
                    ItemCode = x.SatProductCode,
                    UnitOfMeasurementCode = x.SatUnitCode,
                    Description = x.Description,
                    ItemSku = x.Sku,
                    Quantity = x.Quantity,
                    UnitPrice = x.UnitPrice,
                    Discount = x.Discount,
                    TaxObjectCode = x.TaxObjectCode,
                    ItemTaxes = x.Taxes.Select(t => new InvoiceItemTax
                    {
                        TaxCode = t.TaxCode,
                        TaxTypeCode = t.TaxTypeCode,
                        TaxRate = t.Rate,
                        TaxFlagCode = t.TaxFlagCode
                    }).ToList()
                }).ToList()
            });
            if (!response.Succeeded || response.Data is null)
                throw Failure(response.Message, response.Details, response.HttpStatusCode);
            var uuid = response.Data.Responses?.Select(x => x.InvoiceUuid).FirstOrDefault(x => !string.IsNullOrWhiteSpace(x));
            if (string.IsNullOrWhiteSpace(response.Data.Id) || string.IsNullOrWhiteSpace(uuid))
                throw new ElectronicInvoicingProviderException("FiscalAPI returned an incomplete invoice result.", "incomplete_response", true);
            return new ProviderInvoiceResult(response.Data.Id, uuid);
        }
        catch (ElectronicInvoicingProviderException) { throw; }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            throw new ElectronicInvoicingProviderException("FiscalAPI could not be reached.", "provider_unavailable", true, ex);
        }
    }

    public Task<ProviderFile> DownloadXmlAsync(string providerInvoiceId, CancellationToken cancellationToken) =>
        DownloadAsync(() => client.Invoices.GetXmlAsync(providerInvoiceId), "application/xml", cancellationToken);

    public Task<ProviderFile> DownloadPdfAsync(string providerInvoiceId, CancellationToken cancellationToken) =>
        DownloadAsync(() => client.Invoices.GetPdfAsync(new CreatePdfRequest { InvoiceId = providerInvoiceId }), "application/pdf", cancellationToken);

    public async Task CancelAsync(string providerInvoiceId, string fiscalUuid, string reasonCode, string? replacementUuid, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var response = await client.Invoices.CancelAsync(new CancelInvoiceRequest
        {
            Id = providerInvoiceId,
            InvoiceUuid = fiscalUuid,
            CancellationReasonCode = reasonCode,
            ReplacementUuid = replacementUuid
        });
        if (!response.Succeeded) throw Failure(response.Message, response.Details, response.HttpStatusCode);
    }

    private static async Task<ProviderFile> DownloadAsync(Func<Task<Fiscalapi.Common.ApiResponse<Fiscalapi.Common.FileResponse>>> action, string contentType, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        var response = await action();
        if (!response.Succeeded || response.Data is null) throw Failure(response.Message, response.Details, response.HttpStatusCode);
        try { return new ProviderFile(response.Data.FileName, contentType, Convert.FromBase64String(response.Data.Base64File)); }
        catch (FormatException ex) { throw new ElectronicInvoicingProviderException("FiscalAPI returned an invalid file.", "invalid_file", false, ex); }
    }

    private static ElectronicInvoicingProviderException Failure(string? message, string? details, int status) =>
        new(string.IsNullOrWhiteSpace(message) ? "FiscalAPI rejected the request." : message,
            $"fiscalapi_http_{status}",
            status >= ServerErrorStatusCode || status == UnknownHttpStatusCode,
            string.IsNullOrWhiteSpace(details) ? null : new InvalidOperationException(details));
}
