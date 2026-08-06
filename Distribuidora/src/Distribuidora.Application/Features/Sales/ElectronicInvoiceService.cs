using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Requests;
using Distribuidora.Domain.Catalogs;
using Distribuidora.Domain.Common;
using Distribuidora.Domain.Sales;
using System.Text.RegularExpressions;

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
        Validate(request, sale);

        var billingRecipient = db.Query(Specification.Create<SaleBillingRecipient>(x => x.SaleId == saleId)).SingleOrDefault();
        var fiscalStatus = db.Query(Specification.Create<SaleFiscalStatus>(x => x.SaleId == saleId)).SingleOrDefault();
        CustomerFiscalProfile? fiscalProfile = null;
        if (!sale.CustomerId.HasValue)
        {
            if (billingRecipient is null || fiscalStatus is null)
                throw new ConflictException("Assign a billing recipient and reconcile fiscal coverage before invoicing.");
            if (fiscalStatus.CoverageStatus != FiscalCoverageStatus.ReservedForNominativeInvoice)
                throw new ConflictException("The sale is not reserved for a nominative invoice.");
            var customer = db.Query(Specification.Create<Customer>(x => x.Id == billingRecipient.CustomerId && x.Active)).SingleOrDefault()
                ?? throw new NotFoundException("Active billing customer not found.");
            fiscalProfile = customer.FiscalProfile;
            if (fiscalProfile?.IsComplete() != true)
                throw new DomainRuleException("The billing customer requires a complete CFDI 4.0 fiscal profile.");
            EnsureRecipientMatchesProfile(request.Recipient, fiscalProfile);
        }

        var model = BuildModel(sale, request, fiscalProfile);

        var record = new ElectronicInvoice
        {
            SaleId = saleId,
            Provider = provider.Name,
            IdempotencyKey = $"sale:{saleId:N}",
            CreatedBy = actorId,
            BillingCustomerId = billingRecipient?.CustomerId ?? sale.CustomerId,
            RecipientTaxId = model.Recipient.TaxId,
            RecipientLegalName = model.Recipient.LegalName,
            RecipientFiscalZipCode = model.Recipient.ZipCode,
            RecipientTaxRegimeCode = model.Recipient.TaxRegimeCode,
            CfdiUseCode = model.Recipient.CfdiUseCode,
            PaymentFormCode = model.PaymentFormCode,
            PaymentMethodCode = model.PaymentMethodCode,
            CurrencyCode = model.CurrencyCode,
            ExpeditionZipCode = model.ExpeditionZipCode
        };
        db.Add(record);
        if (billingRecipient is not null)
        {
            billingRecipient.Lock(clock.UtcNow);
            billingRecipient.UpdatedBy = actorId;
            billingRecipient.UpdatedAt = clock.UtcNow;
            fiscalStatus!.MarkNominativeInvoicePending(clock.UtcNow);
            fiscalStatus.UpdatedBy = actorId;
            fiscalStatus.UpdatedAt = clock.UtcNow;
        }
        await db.SaveChangesAsync(ct);

        try
        {
            var result = await provider.IssueAsync(model, ct);
            record.MarkIssued(result.ProviderInvoiceId, result.FiscalUuid, clock.UtcNow);
            fiscalStatus?.MarkNominativeInvoiceIssued(clock.UtcNow);
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
            fiscalStatus?.RequireReconciliation(
                ex.OutcomeUnknown
                    ? "Electronic invoice provider outcome is unknown."
                    : "Electronic invoice provider rejected the request.",
                clock.UtcNow);
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
        if (request.ReasonCode is not ("01" or "02" or "03")) throw new ArgumentException("Invalid SAT cancellation reason code for a nominative invoice.");
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
        if (!Regex.IsMatch(request.PaymentFormCode ?? "", @"^\d{2}$")) throw new ArgumentException("A valid SAT payment form code is required.");
        if (string.IsNullOrWhiteSpace(request.Recipient.TaxId) || string.IsNullOrWhiteSpace(request.Recipient.LegalName) ||
            string.IsNullOrWhiteSpace(request.Recipient.ZipCode) || string.IsNullOrWhiteSpace(request.Recipient.TaxRegimeCode) || string.IsNullOrWhiteSpace(request.Recipient.CfdiUseCode))
            throw new ArgumentException("Complete CFDI 4.0 recipient data is required.");
        if (!Regex.IsMatch(request.Recipient.TaxId, @"^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$", RegexOptions.IgnoreCase) ||
            !Regex.IsMatch(request.Recipient.ZipCode, @"^\d{5}$") ||
            !Regex.IsMatch(request.Recipient.TaxRegimeCode, @"^\d{3}$") ||
            !Regex.IsMatch(request.Recipient.CfdiUseCode, "^[A-Z0-9]{3,4}$", RegexOptions.IgnoreCase))
            throw new ArgumentException("The CFDI 4.0 recipient data format is invalid.");
        if (request.Items.Count != sale.Items.Count || request.Items.Select(x => x.ProductId).Distinct().Count() != request.Items.Count ||
            sale.Items.Any(line => request.Items.All(x => x.ProductId != line.ProductId)))
            throw new ArgumentException("Fiscal item metadata must match every sale line exactly once.");
        if (request.Items.Any(x => string.IsNullOrWhiteSpace(x.SatProductCode) || string.IsNullOrWhiteSpace(x.SatUnitCode) || string.IsNullOrWhiteSpace(x.TaxObjectCode)))
            throw new ArgumentException("SAT product, unit and tax object codes are required for every item.");
        if (request.Items.Any(x => !Regex.IsMatch(x.SatProductCode, @"^\d{8}$") ||
                                   !Regex.IsMatch(x.SatUnitCode, "^[A-Z0-9]{2,3}$", RegexOptions.IgnoreCase) ||
                                   x.Taxes.Any(tax => tax.Rate < 0 || tax.Rate > 1)))
            throw new ArgumentException("Fiscal item metadata contains an invalid SAT code or tax rate.");
    }

    private IssueElectronicInvoiceModel BuildModel(
        CounterSale sale,
        IssueElectronicInvoiceRequest request,
        CustomerFiscalProfile? fiscalProfile)
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
        var recipient = fiscalProfile is null
            ? new ElectronicInvoiceRecipient(
                request.Recipient.TaxId.Trim().ToUpperInvariant(),
                request.Recipient.LegalName.Trim().ToUpperInvariant(),
                request.Recipient.ZipCode.Trim(), request.Recipient.TaxRegimeCode.Trim(),
                request.Recipient.CfdiUseCode.Trim().ToUpperInvariant(), request.Recipient.Email)
            : new ElectronicInvoiceRecipient(
                fiscalProfile.TaxId, fiscalProfile.LegalName, fiscalProfile.FiscalZipCode,
                fiscalProfile.TaxRegimeCode, request.Recipient.CfdiUseCode.Trim().ToUpperInvariant(),
                request.Recipient.Email ?? fiscalProfile.InvoiceEmail);
        return new(profile.Series, sale.Folio, sale.SaleDate, request.PaymentFormCode,
            sale.Balance > 0 ? "PPD" : "PUE", "MXN", profile.ExpeditionZipCode, profile.IssuerProviderId,
            recipient, lines);
    }

    private static void EnsureRecipientMatchesProfile(
        ElectronicInvoiceRecipientRequest recipient,
        CustomerFiscalProfile profile)
    {
        if (!string.Equals(recipient.TaxId.Trim(), profile.TaxId, StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(recipient.LegalName.Trim(), profile.LegalName, StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(recipient.ZipCode.Trim(), profile.FiscalZipCode, StringComparison.Ordinal) ||
            !string.Equals(recipient.TaxRegimeCode.Trim(), profile.TaxRegimeCode, StringComparison.Ordinal))
            throw new ConflictException("Recipient data does not match the assigned customer fiscal profile. Reload it before invoicing.");
    }
}
