using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Domain.Audits;

namespace Distribuidora.Application.Features.Audits;

public sealed class AuditService(IAppDbContext db, IDatatimeProvider datetimeProvider)
{
    public PagedResponse<AuditLog> GetLogs(
        DateTimeOffset from, DateTimeOffset to, string? module, Guid? userId,
        string? action, string? entityName, Guid? entityId, string? operationId,
        string? transactionId, string? correlationId, string? referenceFolio,
        int page, int pageSize)
    {
        if (from > to) throw new ArgumentException("From date must be before to date.");
        var filter = Specification.Create<AuditLog>(x => x.OccurredAt >= from && x.OccurredAt <= to &&
            (module == null || x.Module == module) && (!userId.HasValue || x.UserId == userId) &&
            (action == null || x.Action == action) && (entityName == null || x.EntityName == entityName) &&
            (!entityId.HasValue || x.EntityId == entityId) && (operationId == null || x.OperationId == operationId) &&
            (transactionId == null || x.TransactionId == transactionId) && (correlationId == null || x.CorrelationId == correlationId) &&
            (referenceFolio == null || x.ReferenceFolio == referenceFolio));
        var total = db.Query(filter).Count();
        var items = db.Query(filter).OrderByDescending(x => x.OccurredAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToArray();
        return new(items, page, pageSize, total);
    }

    public AuditLog GetLog(Guid id) => db.Query(Specification.Create<AuditLog>(x => x.Id == id)).SingleOrDefault() ?? throw new NotFoundException("Audit log not found.");
    public IReadOnlyCollection<AuditLog> GetByEntity(string entityName, Guid entityId) =>
        db.Query(Specification.Create<AuditLog>(x => x.EntityName == entityName && x.EntityId == entityId)).OrderBy(x => x.CreatedAt).ToArray();
    public IReadOnlyCollection<CancellationReason> GetCancellationReasons() =>
        db.Query(Specification.All<CancellationReason>()).OrderBy(x => x.Module).ThenBy(x => x.Code).ToArray();

    public async Task<CancellationReason> SaveCancellationReasonAsync(Guid? id, CancellationReasonRequest r, Guid actor, string correlationId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(r.Code) || string.IsNullOrWhiteSpace(r.Description)) throw new ArgumentException("Code and description are required.");
        var reason = id is null ? new CancellationReason { CreatedBy = actor } :
            db.Query(Specification.Create<CancellationReason>(x => x.Id == id)).SingleOrDefault() ?? throw new NotFoundException("Cancellation reason not found.");
        if (id.HasValue && db.Query(Specification.Create<AuditLog>(x => x.EntityName.Contains("Cancel") && x.AfterData != null && x.AfterData.Contains(reason.Code))).Any() &&
            (reason.Code != r.Code || reason.Description != r.Description))
            throw new ConflictException("A historically used reason can only be deactivated.");
        reason.Code = r.Code; reason.Description = r.Description; reason.Module = r.Module; reason.RequiresAuthorization = r.RequiresAuthorization; reason.Active = r.Active;
        if (id is null) db.Add(reason);
        var utcNow = datetimeProvider.UtcNow;
        db.Add(new AuditLog { OccurredAt = utcNow, CreatedAt = utcNow, UserId = actor, Action = AuditActionName.For(nameof(CancellationReason), id is null ? "Create" : "Update"), Module = "audit", EntityName = nameof(CancellationReason), EntityId = reason.Id, CorrelationId = correlationId });
        await db.SaveChangesAsync(ct); return reason;
    }

    public async Task<OperationalNote> AddNoteAsync(OperationalNoteRequest r, Guid actor, string correlationId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(r.Note)) throw new ArgumentException("Note is required.");
        var utcNow = datetimeProvider.UtcNow;
        var note = new OperationalNote { EntityName = r.EntityName, EntityId = r.EntityId, Note = r.Note, CreatedBy = actor, CreatedAt = utcNow };
        db.Add(note);
        db.Add(new AuditLog { OccurredAt = utcNow, CreatedAt = utcNow, UserId = actor, Action = AuditActionName.For(r.EntityName, "AddNote"), Module = "audit", EntityName = r.EntityName, EntityId = r.EntityId, CorrelationId = correlationId });
        await db.SaveChangesAsync(ct); return note;
    }
}
