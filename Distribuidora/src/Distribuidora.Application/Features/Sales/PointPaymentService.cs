using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Specifications;
using Distribuidora.Domain.Common;
using Distribuidora.Domain.Sales;

namespace Distribuidora.Application.Features.Sales;

public sealed class PointPaymentService(
    IAppDbContext db,
    IMercadoPagoPointClient pointClient,
    IMercadoPagoWebhookValidator webhookValidator,
    SalesService sales,
    AuditEntryService audit,
    IDatatimeProvider datetimeProvider)
{
    private static readonly PointPaymentStatus[] ActiveStatuses =
        [PointPaymentStatus.Creating, PointPaymentStatus.Pending, PointPaymentStatus.AtTerminal,
            PointPaymentStatus.ActionRequired, PointPaymentStatus.Failed, PointPaymentStatus.ReconciliationRequired];

    public PointPayment GetForSale(Guid saleId) =>
        db.Query(Specification.Create<PointPayment>(x => x.SaleId == saleId))
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefault() ?? throw new NotFoundException("No Mercado Pago Point payment exists for this sale.");

    public async Task<PointPayment> StartAsync(
        Guid saleId,
        decimal amount,
        Guid actorId,
        string correlationId,
        CancellationToken cancellationToken)
    {
        var sale = sales.GetById(saleId);
        sale.Recalculate();
        if (sale.Status != DocumentStatus.Draft)
            throw new ConflictException("Only a draft sale can be sent to the Point terminal.");
        if (amount <= 0 || amount != sale.Balance)
            throw new ArgumentException("The Point payment amount must match the full outstanding sale balance.");
        var active = db.Query(Specification.Create<PointPayment>(x =>
                x.SaleId == saleId && ActiveStatuses.Contains(x.Status)))
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefault();
        if (active?.OrderId is not null) return active;

        var payment = active ?? new PointPayment
        {
            SaleId = saleId,
            InitiatedBy = actorId,
            Amount = amount,
            TerminalId = pointClient.TerminalId,
            IdempotencyKey = Guid.NewGuid().ToString(),
            CreatedBy = actorId
        };
        if (active is null)
        {
            payment.ExternalReference = $"sale_{saleId:N}_{payment.Id.ToString("N")[..8]}";
            db.Add(payment);
            await db.SaveChangesAsync(cancellationToken);
        }

        try
        {
            var order = await pointClient.CreateOrderAsync(
                payment.ExternalReference, payment.IdempotencyKey, payment.Amount, cancellationToken);
            if (!string.Equals(order.ExternalReference, payment.ExternalReference, StringComparison.Ordinal))
                throw new InvalidOperationException("Mercado Pago returned an unexpected external reference.");
            payment.OrderId = order.Id;
            ApplyOrderState(payment, order);
            payment.UpdatedAt = datetimeProvider.UtcNow;
            payment.UpdatedBy = actorId;
            audit.Add("PointPaymentStarted", "sales", nameof(PointPayment), payment.Id, actorId, correlationId);
            await db.SaveChangesAsync(cancellationToken);
            return payment;
        }
        catch
        {
            // The remote order may have been accepted even if the local response/save failed.
            // Keep the same entity and idempotency key so a retry cannot create a second charge.
            payment.Status = PointPaymentStatus.ReconciliationRequired;
            payment.StatusDetail = "order_creation_result_unknown";
            payment.UpdatedAt = datetimeProvider.UtcNow;
            payment.UpdatedBy = actorId;
            await db.SaveChangesAsync(CancellationToken.None);
            throw;
        }
    }

    public async Task HandleWebhookAsync(
        string signature,
        string requestId,
        string dataId,
        string? applicationId,
        CancellationToken cancellationToken)
    {
        if (!webhookValidator.IsValid(signature, requestId, dataId) ||
            !webhookValidator.IsExpectedApplication(applicationId))
            throw new UnauthorizedException("Invalid Mercado Pago webhook signature.");

        var order = await pointClient.GetOrderAsync(dataId, cancellationToken);
        var pointPayment = db.Query(Specification.Create<PointPayment>(x => x.OrderId == order.Id))
            .SingleOrDefault();
        if (pointPayment is null ||
            !string.Equals(pointPayment.ExternalReference, order.ExternalReference, StringComparison.Ordinal))
            return;

        ApplyOrderState(pointPayment, order);
        pointPayment.UpdatedAt = datetimeProvider.UtcNow;
        pointPayment.UpdatedBy = pointPayment.InitiatedBy;
        if (pointPayment.Status != PointPaymentStatus.Approved)
        {
            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        var transaction = order.Payments.SingleOrDefault(x =>
            string.Equals(x.Status, "processed", StringComparison.OrdinalIgnoreCase) &&
            string.Equals(x.StatusDetail, "accredited", StringComparison.OrdinalIgnoreCase));
        var paidAmount = transaction?.PaidAmount ?? order.TotalPaidAmount ?? transaction?.Amount;
        if (transaction is null || paidAmount != pointPayment.Amount)
        {
            pointPayment.Status = PointPaymentStatus.ReconciliationRequired;
            pointPayment.StatusDetail = "approved_amount_mismatch";
            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        try
        {
            await db.ExecuteAtomicAsync(async token =>
            {
                var sale = sales.GetById(pointPayment.SaleId);
                var reference = $"{order.Id}:{transaction.Id}";
                if (!sale.Payments.Any(x => x.Reference == reference))
                {
                    await sales.RegisterPaymentAsync(sale.Id, new Contracts.Requests.SalePaymentRequest(
                        "card", pointPayment.Amount, reference), pointPayment.InitiatedBy, requestId, token);
                }
                if (sale.Status == DocumentStatus.Draft)
                    await sales.ConfirmAsync(sale.Id, pointPayment.InitiatedBy, requestId, token);
                pointPayment.PaymentId = transaction.Id;
                pointPayment.PaymentMethodType = transaction.PaymentMethodType;
                pointPayment.PaymentMethodId = transaction.PaymentMethodId;
                pointPayment.Installments = transaction.Installments;
                pointPayment.CompletedAt = datetimeProvider.UtcNow;
                pointPayment.StatusDetail = "accredited";
                audit.Add("PointPaymentApproved", "sales", nameof(PointPayment), pointPayment.Id,
                    pointPayment.InitiatedBy, requestId);
                await db.SaveChangesAsync(token);
                return true;
            }, cancellationToken);
        }
        catch (Exception ex) when (ex is DomainRuleException or ConflictException)
        {
            pointPayment.Status = PointPaymentStatus.ReconciliationRequired;
            pointPayment.StatusDetail = "sale_confirmation_failed";
            pointPayment.UpdatedAt = datetimeProvider.UtcNow;
            await db.SaveChangesAsync(CancellationToken.None);
        }
    }

    private static void ApplyOrderState(PointPayment payment, MercadoPagoPointOrder order)
    {
        payment.StatusDetail = order.StatusDetail;
        payment.Status = order.Status.ToLowerInvariant() switch
        {
            "created" => PointPaymentStatus.Pending,
            "at_terminal" => PointPaymentStatus.AtTerminal,
            "action_required" => PointPaymentStatus.ActionRequired,
            "processed" when order.StatusDetail is "accredited" or "processed" => PointPaymentStatus.Approved,
            "failed" => PointPaymentStatus.Failed,
            "canceled" => PointPaymentStatus.Cancelled,
            "expired" => PointPaymentStatus.Expired,
            _ => payment.Status
        };
    }
}
