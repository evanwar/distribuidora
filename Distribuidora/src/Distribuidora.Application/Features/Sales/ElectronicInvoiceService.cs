using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Requests;
using Distribuidora.Domain.Catalogs;
using Distribuidora.Domain.Common;
using Distribuidora.Domain.Sales;

namespace Distribuidora.Application.Features.Sales;

public sealed class ElectronicInvoiceService(
    IAppDbContext db,
    IElectronicInvoicingProvider provider,
    IElectronicInvoicingProfile profile,
    AuditEntryService audit,
    IDatatimeProvider clock)
{
    public ElectronicInvoice Get(Guid saleId) => db.Query(Specification.Create<ElectronicInvoice>(x => x.SaleId == saleId)).SingleOrDefault()
        ?? throw new NotFoundException("Electronic invoice not found.");

    public async Task<ElectronicInvoice> IssueAsync(Guid saleId, IssueElectronicInvoiceRequest request, Guid actorId, string correlationId, CancellationToken ct)
    {
        var existing = db.Query(Specification.Create<ElectronicInvoice>(x => x.SaleId == saleId)).SingleOrDefault();
        if (existing is not null) return existing.Status == ElectronicInvoiceStatus.Issued
            ? existing
            : throw new ConflictException("An electronic invoice attempt already exists. Review its status before taking further action.");

        var sale = db.Query(Specification.Create<CounterSale>(x => x.Id == saleId)).SingleOrDefault()
            ?? throw new NotFoundException("Sale not found.");
        if (sale.Status != DocumentStatus.Confirmed) throw new ConflictException("Only a confirmed sale can be invoiced.");
        if (!sale.CustomerId.HasValue) throw new ArgumentException("A customer is required for electronic invoicing.");
        Validate(request, sale);

        var record = new ElectronicInvoice
        {
            SaleId = saleId,
            Provider = provider.Name,
            IdempotencyKey = $"sale:{saleId:N}",
            CreatedBy = actorId
        };
        db.Add(record);
        await db.SaveChangesAsync(ct);

        try
        {
            var result = await provider.IssueAsync(BuildModel(sale, request), ct);
            record.MarkIssued(result.ProviderInvoiceId, result.FiscalUuid, clock.UtcNow);
            record.UpdatedBy = actorId;
            record.UpdatedAt = clock.UtcNow;
            audit.Add("IssueElectronicInvoice", "sales", nameof(ElectronicInvoice), record.Id, actorId, correlationId);
            await db.SaveChangesAsync(ct);
            return record;
        }
        catch (ElectronicInvoicingProviderException ex)
        {
            record.MarkFailed(ex.Code, ex.OutcomeUnknown
                ? "The provider outcome is unknown. Reconcile with the provider before retrying."
                : ex.Message);
            record.UpdatedBy = actorId;
            record.UpdatedAt = clock.UtcNow;
            await db.SaveChangesAsync(CancellationToken.None);
            throw;
        }
    }

    public async Task<ProviderFile> DownloadAsync(Guid saleId, string format, CancellationToken ct)
    {
        var invoice = Get(saleId);
        if (invoice.Status is not (ElectronicInvoiceStatus.Issued or ElectronicInvoiceStatus.Cancelled) || string.IsNullOrWhiteSpace(invoice.ProviderInvoiceId))
            throw new ConflictException("The electronic invoice has no downloadable fiscal document.");
        return format.ToLowerInvariant() switch
        {
            "xml" => await provider.DownloadXmlAsync(invoice.ProviderInvoiceId, ct),
            "pdf" => await provider.DownloadPdfAsync(invoice.ProviderInvoiceId, ct),
            _ => throw new ArgumentException("Format must be xml or pdf.")
        };
    }

    public async Task<ElectronicInvoice> CancelAsync(Guid saleId, CancelElectronicInvoiceRequest request, Guid actorId, string correlationId, CancellationToken ct)
    {
        var invoice = Get(saleId);
        if (invoice.Status != ElectronicInvoiceStatus.Issued || string.IsNullOrWhiteSpace(invoice.ProviderInvoiceId) || string.IsNullOrWhiteSpace(invoice.FiscalUuid))
            throw new ConflictException("Only an issued electronic invoice can be cancelled.");
        if (request.ReasonCode is not ("01" or "02" or "03" or "04")) throw new ArgumentException("Invalid SAT cancellation reason code.");
        if (request.ReasonCode == "01" && string.IsNullOrWhiteSpace(request.ReplacementUuid)) throw new ArgumentException("Replacement UUID is required for reason 01.");
        await provider.CancelAsync(invoice.ProviderInvoiceId, invoice.FiscalUuid, request.ReasonCode, request.ReplacementUuid, ct);
        invoice.MarkCancelled(request.ReasonCode, clock.UtcNow);
        invoice.UpdatedBy = actorId;
        invoice.UpdatedAt = clock.UtcNow;
        audit.Add("CancelElectronicInvoice", "sales", nameof(ElectronicInvoice), invoice.Id, actorId, correlationId);
        await db.SaveChangesAsync(ct);
        return invoice;
    }

    private static void Validate(IssueElectronicInvoiceRequest request, CounterSale sale)
    {
        if (string.IsNullOrWhiteSpace(request.PaymentFormCode) || request.PaymentFormCode.Length != 2) throw new ArgumentException("A valid SAT payment form code is required.");
        if (string.IsNullOrWhiteSpace(request.Recipient.TaxId) || string.IsNullOrWhiteSpace(request.Recipient.LegalName) ||
            string.IsNullOrWhiteSpace(request.Recipient.ZipCode) || string.IsNullOrWhiteSpace(request.Recipient.TaxRegimeCode) || string.IsNullOrWhiteSpace(request.Recipient.CfdiUseCode))
            throw new ArgumentException("Complete CFDI 4.0 recipient data is required.");
        if (request.Items.Count != sale.Items.Count || request.Items.Select(x => x.ProductId).Distinct().Count() != request.Items.Count ||
            sale.Items.Any(line => request.Items.All(x => x.ProductId != line.ProductId)))
            throw new ArgumentException("Fiscal item metadata must match every sale line exactly once.");
        if (request.Items.Any(x => string.IsNullOrWhiteSpace(x.SatProductCode) || string.IsNullOrWhiteSpace(x.SatUnitCode) || string.IsNullOrWhiteSpace(x.TaxObjectCode)))
            throw new ArgumentException("SAT product, unit and tax object codes are required for every item.");
    }

    private IssueElectronicInvoiceModel BuildModel(CounterSale sale, IssueElectronicInvoiceRequest request)
    {
        var lines = sale.Items.Select(line =>
        {
            var metadata = request.Items.Single(x => x.ProductId == line.ProductId);
            var product = db.Query(Specification.Create<Product>(x => x.Id == line.ProductId)).Single();
            return new ElectronicInvoiceLine(metadata.SatProductCode, metadata.SatUnitCode, product.Name, product.Sku,
                line.Quantity, line.UnitPrice, line.Discount, metadata.TaxObjectCode,
                metadata.Taxes.Select(x => new ElectronicInvoiceTax(x.TaxCode, x.TaxTypeCode, x.Rate, x.TaxFlagCode)).ToArray());
        }).ToArray();
        if (string.IsNullOrWhiteSpace(profile.IssuerProviderId) || string.IsNullOrWhiteSpace(profile.ExpeditionZipCode))
            throw new InvalidOperationException("Electronic invoicing issuer and expedition ZIP code are not configured.");
        return new(profile.Series, sale.Folio, sale.SaleDate, request.PaymentFormCode,
            sale.Balance > 0 ? "PPD" : "PUE", "MXN", profile.ExpeditionZipCode, profile.IssuerProviderId,
            new(request.Recipient.TaxId, request.Recipient.LegalName, request.Recipient.ZipCode,
                request.Recipient.TaxRegimeCode, request.Recipient.CfdiUseCode, request.Recipient.Email), lines);
    }
}
