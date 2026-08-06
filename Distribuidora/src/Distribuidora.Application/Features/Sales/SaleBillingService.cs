using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Distribuidora.Domain.Catalogs;
using Distribuidora.Domain.Common;
using Distribuidora.Domain.Sales;

namespace Distribuidora.Application.Features.Sales;

public sealed class SaleBillingService(
    IAppDbContext db,
    AuditEntryService audit,
    IDatatimeProvider clock)
{
    public SaleBillingEligibilityResponse GetEligibility(Guid saleId)
    {
        var sale = GetSale(saleId);
        var fiscalStatus = GetFiscalStatus(saleId);
        var recipient = GetRecipient(saleId);
        var invoice = GetInvoice(saleId);
        var (eligible, reasonCode, requiredAction) = Evaluate(sale, fiscalStatus, recipient, invoice);
        return new(
            eligible, reasonCode, requiredAction, sale.Id, sale.Status.ToString(), recipient?.CustomerId,
            fiscalStatus?.CoverageStatus.ToString() ?? FiscalCoverageStatus.ReconciliationRequired.ToString(),
            invoice?.Status.ToString(), fiscalStatus?.RowVersion ?? sale.RowVersion);
    }

    public SaleFiscalStatusResponse GetStatus(Guid saleId)
    {
        _ = GetSale(saleId);
        var fiscalStatus = GetFiscalStatus(saleId);
        var recipient = GetRecipient(saleId);
        var invoice = GetInvoice(saleId);
        return new(
            saleId,
            fiscalStatus?.CoverageStatus.ToString() ?? FiscalCoverageStatus.ReconciliationRequired.ToString(),
            fiscalStatus?.GlobalInvoiceFiscalUuid,
            fiscalStatus?.ReconciliationReason ?? (fiscalStatus is null ? "Historical fiscal coverage has not been reconciled." : null),
            recipient?.CustomerId,
            invoice?.Status.ToString(),
            fiscalStatus?.RowVersion ?? 0);
    }

    public Task<SaleBillingRecipient> AssignAsync(
        Guid saleId,
        AssignSaleBillingRecipientRequest request,
        Guid actorId,
        string correlationId,
        CancellationToken ct) =>
        db.ExecuteAtomicAsync(async token =>
        {
            var sale = GetSale(saleId);
            if (sale.Status != DocumentStatus.Confirmed) throw new ConflictException("Only a confirmed sale can receive a billing recipient.");
            if (sale.CustomerId.HasValue) throw new ConflictException("The sale already has an original commercial customer.");
            if (GetInvoice(saleId) is not null) throw new ConflictException("The billing recipient is locked by an electronic invoice attempt.");

            var fiscalStatus = GetFiscalStatus(saleId)
                ?? throw new ConflictException("Historical fiscal coverage must be reconciled before assigning a billing recipient.");
            if (request.RowVersion.HasValue && fiscalStatus.RowVersion != request.RowVersion.Value)
                throw new ConflictException("The fiscal status changed. Reload the sale before continuing.");

            var customer = db.Query(Specification.Create<Customer>(x => x.Id == request.CustomerId && x.Active)).SingleOrDefault()
                ?? throw new NotFoundException("Active billing customer not found.");
            if (customer.FiscalProfile?.IsComplete() != true)
                throw new DomainRuleException("The customer requires a complete CFDI 4.0 fiscal profile.");

            var recipient = GetRecipient(saleId);
            var before = recipient is null ? null : new { recipient.CustomerId, Status = recipient.Status.ToString(), recipient.Reason };
            if (recipient is null)
            {
                recipient = new SaleBillingRecipient { SaleId = saleId, CreatedBy = actorId };
                db.Add(recipient);
            }
            recipient.Assign(customer.Id, request.Reason, actorId, clock.UtcNow);
            recipient.UpdatedBy = actorId;
            recipient.UpdatedAt = clock.UtcNow;
            fiscalStatus.ReserveForNominativeInvoice(clock.UtcNow);
            fiscalStatus.UpdatedBy = actorId;
            fiscalStatus.UpdatedAt = clock.UtcNow;
            audit.Add(
                before is null ? "AssignBillingRecipient" : "ReplaceBillingRecipient",
                "sales", nameof(SaleBillingRecipient), recipient.Id, actorId, correlationId,
                before,
                new { recipient.CustomerId, Status = recipient.Status.ToString(), recipient.Reason },
                request.Reason);
            await db.SaveChangesAsync(token);
            return recipient;
        }, ct);

    public Task<SaleFiscalStatus> ReconcileAsync(
        Guid saleId,
        ReconcileSaleFiscalCoverageRequest request,
        Guid actorId,
        string correlationId,
        CancellationToken ct) =>
        db.ExecuteAtomicAsync(async token =>
        {
            var sale = GetSale(saleId);
            if (sale.Status != DocumentStatus.Confirmed || sale.CustomerId.HasValue)
                throw new ConflictException("Only a confirmed public sale can be fiscally reconciled.");
            if (GetInvoice(saleId) is not null) throw new ConflictException("An electronic invoice attempt already exists.");
            if (!Enum.TryParse<FiscalCoverageStatus>(request.CoverageStatus, true, out var target))
                throw new ArgumentException("Invalid fiscal coverage status.");

            var fiscalStatus = GetFiscalStatus(saleId);
            if (fiscalStatus is null)
            {
                if (request.RowVersion.HasValue && sale.RowVersion != request.RowVersion.Value)
                    throw new ConflictException("The sale changed. Reload it before reconciling fiscal coverage.");
                fiscalStatus = new SaleFiscalStatus { SaleId = saleId, CreatedBy = actorId };
                db.Add(fiscalStatus);
            }
            else if (request.RowVersion.HasValue && fiscalStatus.RowVersion != request.RowVersion.Value)
            {
                throw new ConflictException("The fiscal status changed. Reload the sale before continuing.");
            }

            var before = new { CoverageStatus = fiscalStatus.CoverageStatus.ToString(), fiscalStatus.GlobalInvoiceFiscalUuid };
            fiscalStatus.Reconcile(target, request.Reason, request.GlobalInvoiceFiscalUuid, clock.UtcNow);
            fiscalStatus.UpdatedBy = actorId;
            fiscalStatus.UpdatedAt = clock.UtcNow;
            audit.Add("ReconcileFiscalCoverage", "sales", nameof(SaleFiscalStatus), fiscalStatus.Id, actorId, correlationId,
                before, new { CoverageStatus = fiscalStatus.CoverageStatus.ToString(), fiscalStatus.GlobalInvoiceFiscalUuid }, request.Reason);
            await db.SaveChangesAsync(token);
            return fiscalStatus;
        }, ct);

    private CounterSale GetSale(Guid saleId) =>
        db.Query(Specification.Create<CounterSale>(x => x.Id == saleId)).SingleOrDefault()
        ?? throw new NotFoundException("Sale not found.");

    private SaleFiscalStatus? GetFiscalStatus(Guid saleId) =>
        db.Query(Specification.Create<SaleFiscalStatus>(x => x.SaleId == saleId)).SingleOrDefault();

    private SaleBillingRecipient? GetRecipient(Guid saleId) =>
        db.Query(Specification.Create<SaleBillingRecipient>(x => x.SaleId == saleId)).SingleOrDefault();

    private ElectronicInvoice? GetInvoice(Guid saleId) =>
        db.Query(Specification.Create<ElectronicInvoice>(x => x.SaleId == saleId)).SingleOrDefault();

    private static (bool Eligible, string ReasonCode, string RequiredAction) Evaluate(
        CounterSale sale,
        SaleFiscalStatus? fiscalStatus,
        SaleBillingRecipient? recipient,
        ElectronicInvoice? invoice)
    {
        if (sale.Status != DocumentStatus.Confirmed) return (false, "sale_not_confirmed", "none");
        if (invoice?.Status == ElectronicInvoiceStatus.Issued) return (false, "invoice_already_issued", "view_invoice");
        if (invoice is not null) return (false, "invoice_attempt_exists", "reconcile_invoice");
        if (sale.CustomerId.HasValue) return (true, "commercial_customer_available", "issue_invoice");
        if (fiscalStatus is null) return (false, "fiscal_coverage_unknown", "reconcile_fiscal_coverage");
        if (fiscalStatus.CoverageStatus == FiscalCoverageStatus.IncludedInOpenGlobalInvoice)
            return (false, "included_in_open_global_invoice", "remove_from_open_global_invoice");
        if (fiscalStatus.CoverageStatus is FiscalCoverageStatus.IncludedInIssuedGlobalInvoice or FiscalCoverageStatus.GlobalInvoiceCancellationPending)
            return (false, "included_in_issued_global_invoice", "replace_global_invoice");
        if (fiscalStatus.CoverageStatus == FiscalCoverageStatus.ReconciliationRequired)
            return (false, "fiscal_reconciliation_required", "reconcile_fiscal_coverage");
        if (recipient is null) return (false, "billing_recipient_required", "assign_billing_recipient");
        return fiscalStatus.CoverageStatus == FiscalCoverageStatus.ReservedForNominativeInvoice
            ? (true, "eligible", "issue_invoice")
            : (false, "invalid_fiscal_coverage", "reconcile_fiscal_coverage");
    }
}
