using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Requests;
using Distribuidora.Domain.Administration;
using Distribuidora.Domain.Audits;
using Distribuidora.Domain.Sales;

namespace Distribuidora.Application.Features.Administration;

public sealed class PaymentTerminalService(IAppDbContext db, IDatatimeProvider datetimeProvider)
{
    private static readonly PointPaymentStatus[] BlockingPaymentStatuses =
    [
        PointPaymentStatus.Creating,
        PointPaymentStatus.Pending,
        PointPaymentStatus.AtTerminal,
        PointPaymentStatus.ActionRequired,
        PointPaymentStatus.ReconciliationRequired
    ];

    public IReadOnlyCollection<PaymentTerminal> GetAll() =>
        db.Query(Specification.All<PaymentTerminal>())
            .OrderByDescending(x => x.IsDefault)
            .ThenBy(x => x.Name)
            .ToArray();

    public IReadOnlyCollection<PaymentTerminal> GetAvailable() =>
        db.Query(Specification.Create<PaymentTerminal>(x => x.Active))
            .OrderByDescending(x => x.IsDefault)
            .ThenBy(x => x.Name)
            .ToArray();

    public PaymentTerminal GetById(Guid id) =>
        db.Query(Specification.Create<PaymentTerminal>(x => x.Id == id)).SingleOrDefault()
        ?? throw new NotFoundException("Payment terminal not found.");

    public PaymentTerminal ResolveForPayment(Guid? id)
    {
        if (id is not null)
        {
            var selected = GetById(id.Value);
            if (!selected.Active)
                throw new ConflictException("The selected payment terminal is inactive.");
            return selected;
        }

        var available = GetAvailable();
        return available.FirstOrDefault(x => x.IsDefault)
               ?? (available.Count == 1
                   ? available.Single()
                   : throw new ConflictException(
                       "Select an active payment terminal or configure a default terminal."));
    }

    public Task<PaymentTerminal> SaveAsync(
        Guid? id,
        PaymentTerminalRequest request,
        Guid actorId,
        string correlationId,
        CancellationToken cancellationToken) =>
        db.ExecuteAtomicAsync(async ct =>
        {
            Validate(request);
            var normalizedExternalId = request.ExternalId.Trim();
            if (db.Query(Specification.Create<PaymentTerminal>(x =>
                    x.Provider == PaymentTerminalProviders.MercadoPago &&
                    x.ExternalId == normalizedExternalId && x.Id != id)).Any())
                throw new ConflictException("The Mercado Pago terminal identifier is already registered.");

            var entity = id is null
                ? new PaymentTerminal { CreatedBy = actorId }
                : GetById(id.Value);
            if (request.RowVersion is not null && entity.RowVersion != request.RowVersion)
                throw new ConflictException("The payment terminal was modified by another user. Reload it and try again.");
            if (!request.Active && entity.Active)
                EnsureCanDeactivate(entity);

            var utcNow = datetimeProvider.UtcNow;
            var shouldBeDefault = request.Active && request.IsDefault;
            if (shouldBeDefault)
                await ClearExistingDefaultAsync(entity.Id, actorId, utcNow, ct);

            entity.Name = request.Name.Trim();
            entity.Provider = PaymentTerminalProviders.MercadoPago;
            entity.ExternalId = normalizedExternalId;
            entity.Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim();
            entity.Active = request.Active;
            entity.IsDefault = shouldBeDefault;
            entity.UpdatedAt = utcNow;
            entity.UpdatedBy = actorId;
            if (id is null)
            {
                entity.RecordCreated(utcNow);
                db.Add(entity);
            }
            else
            {
                entity.RecordUpdated(utcNow);
            }

            Audit(id is null ? "Create" : "Update", entity.Id, actorId, correlationId, utcNow);
            await db.SaveChangesAsync(ct);
            await EnsureDefaultAsync(actorId, utcNow, ct);
            return entity;
        }, cancellationToken);

    public Task<PaymentTerminal> SetActiveAsync(
        Guid id,
        bool active,
        Guid actorId,
        string correlationId,
        CancellationToken cancellationToken) =>
        db.ExecuteAtomicAsync(async ct =>
        {
            var entity = GetById(id);
            var utcNow = datetimeProvider.UtcNow;
            if (active)
                entity.Activate(utcNow);
            else
            {
                EnsureCanDeactivate(entity);
                entity.Deactivate(utcNow);
            }

            entity.UpdatedAt = utcNow;
            entity.UpdatedBy = actorId;
            Audit(active ? "Activate" : "Deactivate", entity.Id, actorId, correlationId, utcNow);
            await db.SaveChangesAsync(ct);
            await EnsureDefaultAsync(actorId, utcNow, ct);
            return entity;
        }, cancellationToken);

    private async Task ClearExistingDefaultAsync(
        Guid targetId,
        Guid actorId,
        DateTimeOffset occurredAt,
        CancellationToken cancellationToken)
    {
        var defaults = db.Query(Specification.Create<PaymentTerminal>(x =>
            x.Id != targetId && x.IsDefault)).ToArray();
        if (defaults.Length == 0) return;
        foreach (var terminal in defaults)
        {
            terminal.IsDefault = false;
            terminal.UpdatedAt = occurredAt;
            terminal.UpdatedBy = actorId;
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureDefaultAsync(
        Guid actorId,
        DateTimeOffset occurredAt,
        CancellationToken cancellationToken)
    {
        if (db.Query(Specification.Create<PaymentTerminal>(x => x.Active && x.IsDefault)).Any())
            return;
        var replacement = db.Query(Specification.Create<PaymentTerminal>(x => x.Active))
            .OrderBy(x => x.CreatedAt)
            .FirstOrDefault();
        if (replacement is null) return;
        replacement.IsDefault = true;
        replacement.UpdatedAt = occurredAt;
        replacement.UpdatedBy = actorId;
        await db.SaveChangesAsync(cancellationToken);
    }

    private void EnsureCanDeactivate(PaymentTerminal terminal)
    {
        if (!terminal.Active) return;
        var hasBlockingPayment = db.Query(Specification.Create<PointPayment>(x =>
            (x.PaymentTerminalId == terminal.Id ||
             (x.PaymentTerminalId == null && x.TerminalId == terminal.ExternalId)) &&
            BlockingPaymentStatuses.Contains(x.Status))).Any();
        if (hasBlockingPayment)
            throw new ConflictException(
                "The terminal has an active Mercado Pago order. Cancel or reconcile that order before deactivating it.");
    }

    private static void Validate(PaymentTerminalRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) ||
            request.Name.Trim().Length > PaymentTerminal.NameMaximumLength)
            throw new ArgumentException($"Terminal name is required and cannot exceed {PaymentTerminal.NameMaximumLength} characters.");
        if (string.IsNullOrWhiteSpace(request.ExternalId) ||
            request.ExternalId.Trim().Length > PaymentTerminal.ExternalIdMaximumLength)
            throw new ArgumentException(
                $"Mercado Pago terminal identifier is required and cannot exceed {PaymentTerminal.ExternalIdMaximumLength} characters.");
        if (request.Description?.Trim().Length > PaymentTerminal.DescriptionMaximumLength)
            throw new ArgumentException(
                $"Terminal description cannot exceed {PaymentTerminal.DescriptionMaximumLength} characters.");
        if (!request.Active && request.IsDefault)
            throw new ArgumentException("An inactive payment terminal cannot be the default terminal.");
    }

    private void Audit(
        string action,
        Guid entityId,
        Guid actorId,
        string correlationId,
        DateTimeOffset occurredAt) =>
        db.Add(new AuditLog
        {
            OccurredAt = occurredAt,
            CreatedAt = occurredAt,
            UserId = actorId,
            Action = AuditActionName.For(nameof(PaymentTerminal), action),
            Module = "admin",
            EntityName = nameof(PaymentTerminal),
            EntityId = entityId,
            CorrelationId = correlationId
        });
}
