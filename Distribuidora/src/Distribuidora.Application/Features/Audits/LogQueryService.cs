using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Common;
using Distribuidora.Domain.Audits;

namespace Distribuidora.Application.Features.Audits;

public sealed record ActivityLogItem(
    Guid Id, DateTimeOffset OccurredAt, Guid? UserId, string Module, string Action,
    int? StatusCode, long? DurationMs, bool Succeeded, string CorrelationId,
    string OperationId, string? ReferenceFolio);

public sealed record ErrorLogItem(
    Guid Id, DateTimeOffset OccurredAt, string Severity, string? ErrorCode,
    string ExceptionType, string Message, bool IsResolved, int OccurrenceCount,
    string? Fingerprint, string CorrelationId, string OperationId, string? EventId);

public sealed record EventLogItem(
    Guid Id, string EventId, DateTimeOffset CreatedAt, string EventName, string Status,
    int AttemptCount, string CorrelationId, string OperationId, string? CausationId);

public sealed record TraceItem(
    Guid Id, DateTimeOffset OccurredAt, string Type, string Action, string Status,
    string? EntityName, string? EntityId, string? CorrelationId, string? OperationId,
    string? TransactionId, string? EventId, string? CausationId, string? ReferenceFolio);

public sealed class LogQueryService(ILogQueryStore logs, IAppDbContext db, IDatatimeProvider datetimeProvider)
{
    private const int MaximumTraceItems = 2_000;
    private const int MaximumQueryRangeDays = 93;

    public ActivityLogItem ActivityById(Guid id)
    {
        var x = logs.Query(Specification.Create<UserActivityLog>(x => x.Id == id)).SingleOrDefault() ?? throw new NotFoundException("Activity log not found.");
        return new(x.Id, x.OccurredAt, x.UserId, x.Module, x.Action, x.ResponseStatusCode,
            x.DurationMs, x.Succeeded, x.CorrelationId, x.OperationId, x.ReferenceFolio);
    }

    public ErrorLogItem ErrorById(Guid id)
    {
        var x = logs.Query(Specification.Create<SystemErrorLog>(x => x.Id == id)).SingleOrDefault() ?? throw new NotFoundException("Error log not found.");
        return new(x.Id, x.OccurredAt, x.Severity, x.ErrorCode, x.ExceptionType, x.Message,
            x.IsResolved, x.OccurrenceCount, x.Fingerprint, x.CorrelationId, x.OperationId, x.EventId);
    }

    public EventLogItem EventById(string eventId)
    {
        var x = logs.Query(Specification.Create<SystemEventLog>(x => x.EventId == eventId)).SingleOrDefault() ?? throw new NotFoundException("Event log not found.");
        return new(x.Id, x.EventId, x.CreatedAt, x.EventName, x.Status, x.AttemptCount,
            x.CorrelationId, x.OperationId, x.CausationId);
    }

    public PagedResponse<ActivityLogItem> Activity(
        DateTimeOffset from, DateTimeOffset to, Guid? userId, string? module, string? action,
        bool? succeeded, int? statusCode, string? correlationId, string? operationId,
        string? referenceFolio, int page, int pageSize)
    {
        Validate(from, to);
        var filter = Specification.Create<UserActivityLog>(x =>
            x.OccurredAt >= from && x.OccurredAt <= to &&
            (!userId.HasValue || x.UserId == userId) &&
            (string.IsNullOrWhiteSpace(module) || x.Module == module) &&
            (string.IsNullOrWhiteSpace(action) || x.Action == action) &&
            (!succeeded.HasValue || x.Succeeded == succeeded) &&
            (!statusCode.HasValue || x.ResponseStatusCode == statusCode) &&
            (string.IsNullOrWhiteSpace(correlationId) || x.CorrelationId == correlationId) &&
            (string.IsNullOrWhiteSpace(operationId) || x.OperationId == operationId) &&
            (string.IsNullOrWhiteSpace(referenceFolio) || x.ReferenceFolio == referenceFolio));
        var total = logs.Query(filter).Count();
        var items = logs.Query(filter)
            .OrderByDescending(x => x.OccurredAt).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new ActivityLogItem(x.Id, x.OccurredAt, x.UserId, x.Module, x.Action,
                x.ResponseStatusCode, x.DurationMs, x.Succeeded, x.CorrelationId, x.OperationId, x.ReferenceFolio))
            .ToArray();
        return new(items, page, pageSize, total);
    }

    public PagedResponse<ErrorLogItem> Errors(
        DateTimeOffset from, DateTimeOffset to, string? severity, bool? resolved,
        string? fingerprint, string? correlationId, string? operationId, string? eventId,
        int page, int pageSize)
    {
        Validate(from, to);
        var filter = Specification.Create<SystemErrorLog>(x =>
            x.OccurredAt >= from && x.OccurredAt <= to &&
            (string.IsNullOrWhiteSpace(severity) || x.Severity == severity) &&
            (!resolved.HasValue || x.IsResolved == resolved) &&
            (string.IsNullOrWhiteSpace(fingerprint) || x.Fingerprint == fingerprint) &&
            (string.IsNullOrWhiteSpace(correlationId) || x.CorrelationId == correlationId) &&
            (string.IsNullOrWhiteSpace(operationId) || x.OperationId == operationId) &&
            (string.IsNullOrWhiteSpace(eventId) || x.EventId == eventId));
        var total = logs.Query(filter).Count();
        var items = logs.Query(filter)
            .OrderByDescending(x => x.OccurredAt).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new ErrorLogItem(x.Id, x.OccurredAt, x.Severity, x.ErrorCode, x.ExceptionType,
                x.Message, x.IsResolved, x.OccurrenceCount, x.Fingerprint, x.CorrelationId, x.OperationId, x.EventId))
            .ToArray();
        return new(items, page, pageSize, total);
    }

    public PagedResponse<EventLogItem> Events(
        DateTimeOffset from, DateTimeOffset to, string? name, string? status,
        string? operationId, string? correlationId, string? causationId, int page, int pageSize)
    {
        Validate(from, to);
        var filter = Specification.Create<SystemEventLog>(x =>
            x.CreatedAt >= from && x.CreatedAt <= to &&
            (string.IsNullOrWhiteSpace(name) || x.EventName == name) &&
            (string.IsNullOrWhiteSpace(status) || x.Status == status) &&
            (string.IsNullOrWhiteSpace(operationId) || x.OperationId == operationId) &&
            (string.IsNullOrWhiteSpace(correlationId) || x.CorrelationId == correlationId) &&
            (string.IsNullOrWhiteSpace(causationId) || x.CausationId == causationId));
        var total = logs.Query(filter).Count();
        var items = logs.Query(filter)
            .OrderByDescending(x => x.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new EventLogItem(x.Id, x.EventId, x.CreatedAt, x.EventName, x.Status,
                x.AttemptCount, x.CorrelationId, x.OperationId, x.CausationId))
            .ToArray();
        return new(items, page, pageSize, total);
    }

    public async Task ResolveErrorAsync(Guid id, Guid actor, string? notes, bool resolved, CancellationToken ct)
    {
        var error = logs.Query(Specification.Create<SystemErrorLog>(x => x.Id == id)).SingleOrDefault() ?? throw new NotFoundException("Error log not found.");
        error.IsResolved = resolved;
        error.ResolvedAt = resolved ? datetimeProvider.UtcNow : null;
        error.ResolvedBy = resolved ? actor : null;
        error.ResolutionNotes = resolved ? notes : null;
        await logs.SaveChangesAsync(ct);
    }

    public IReadOnlyCollection<TraceItem> ByOperation(string operationId) => Build(operationId, null, null, null);
    public IReadOnlyCollection<TraceItem> ByCorrelation(string correlationId) => Build(null, correlationId, null, null);
    public IReadOnlyCollection<TraceItem> ByDocument(string folio)
    {
        var documentIds = db.Query(Specification.Create<Distribuidora.Domain.Sales.CounterSale>(x => x.Folio == folio)).Select(x => x.Id)
            .Concat(db.Query(Specification.Create<Distribuidora.Domain.Purchases.PurchaseOrder>(x => x.Folio == folio)).Select(x => x.Id))
            .Concat(db.Query(Specification.Create<Distribuidora.Domain.Purchases.GoodsReceipt>(x => x.Folio == folio)).Select(x => x.Id))
            .Concat(db.Query(Specification.Create<Distribuidora.Domain.Inventory.InventoryAdjustment>(x => x.Folio == folio)).Select(x => x.Id))
            .Distinct().ToArray();
        var operationIds = db.Query(Specification.Create<AuditLog>(
                x => x.ReferenceFolio == folio || (x.EntityId.HasValue && documentIds.Contains(x.EntityId.Value))))
            .Select(x => x.OperationId)
            .Concat(db.Query(Specification.Create<Distribuidora.Domain.Inventory.InventoryMovement>(
                x => x.Folio == folio || documentIds.Contains(x.ReferenceId))).Select(x => x.OperationId))
            .Where(x => x != "").Distinct().ToArray();
        if (operationIds.Length == 0) return Build(null, null, folio, null);
        return operationIds.SelectMany(ByOperation).OrderBy(x => x.OccurredAt).ThenBy(x => x.Id).DistinctBy(x => new { x.Type, x.Id }).ToArray();
    }
    public IReadOnlyCollection<TraceItem> ByEvent(string eventId) => Build(null, null, null, eventId);

    private IReadOnlyCollection<TraceItem> Build(string? operation, string? correlation, string? folio, string? eventId)
    {
        var result = new List<TraceItem>();
        result.AddRange(logs.Query(Specification.Create<UserActivityLog>(x =>
                (operation == null || x.OperationId == operation) &&
                (correlation == null || x.CorrelationId == correlation) &&
                (folio == null || x.ReferenceFolio == folio) &&
                eventId == null)).Take(MaximumTraceItems).AsEnumerable()
            .Select(x => new TraceItem(x.Id, x.OccurredAt, "UserActivity", x.Action, x.Succeeded ? "Succeeded" : "Failed", x.EntityName, x.EntityId, x.CorrelationId, x.OperationId, x.TransactionId, null, x.CausationId, x.ReferenceFolio)));
        result.AddRange(db.Query(Specification.Create<AuditLog>(x =>
                (operation == null || x.OperationId == operation) &&
                (correlation == null || x.CorrelationId == correlation) &&
                (folio == null || x.ReferenceFolio == folio) &&
                (eventId == null || x.EventId == eventId))).Take(MaximumTraceItems).AsEnumerable()
            .Select(x => new TraceItem(x.Id, x.OccurredAt, "Audit", x.Action, "Committed", x.EntityName, x.EntityId?.ToString(), x.CorrelationId, x.OperationId, x.TransactionId, x.EventId, x.CausationId, x.ReferenceFolio)));
        result.AddRange(logs.Query(Specification.Create<SystemErrorLog>(x =>
                (operation == null || x.OperationId == operation) &&
                (correlation == null || x.CorrelationId == correlation) &&
                (folio == null || x.ReferenceFolio == folio) &&
                (eventId == null || x.EventId == eventId))).Take(MaximumTraceItems).AsEnumerable()
            .Select(x => new TraceItem(x.Id, x.OccurredAt, "SystemError", x.ErrorCode ?? x.ExceptionType, x.IsResolved ? "Resolved" : "Open", null, null, x.CorrelationId, x.OperationId, x.TransactionId, x.EventId, x.CausationId, x.ReferenceFolio)));
        result.AddRange(logs.Query(Specification.Create<SystemEventLog>(x =>
                (operation == null || x.OperationId == operation) &&
                (correlation == null || x.CorrelationId == correlation) &&
                (folio == null || x.ReferenceFolio == folio) &&
                (eventId == null || x.EventId == eventId))).Take(MaximumTraceItems).AsEnumerable()
            .Select(x => new TraceItem(x.Id, x.CreatedAt, "SystemEvent", x.EventName, x.Status, x.AggregateType, x.AggregateId, x.CorrelationId, x.OperationId, x.TransactionId, x.EventId, x.CausationId, x.ReferenceFolio)));
        result.AddRange(db.Query(Specification.Create<Distribuidora.Domain.Inventory.InventoryMovement>(x =>
                (operation == null || x.OperationId == operation) &&
                (correlation == null || x.CorrelationId == correlation) &&
                (folio == null || x.Folio == folio) &&
                eventId == null)).Take(MaximumTraceItems).AsEnumerable()
            .Select(x => new TraceItem(x.Id, x.Date, "InventoryMovement", x.MovementType.ToString(), "Committed", nameof(x), x.Id.ToString(), x.CorrelationId, x.OperationId, x.TransactionId, null, null, x.Folio)));
        return result.OrderBy(x => x.OccurredAt).ThenBy(x => x.Id).Take(MaximumTraceItems).ToArray();
    }

    private static void Validate(DateTimeOffset from, DateTimeOffset to)
    {
        if (from > to) throw new ArgumentException("From date must be before to date.");
        if (to - from > TimeSpan.FromDays(MaximumQueryRangeDays))
            throw new ArgumentException($"Date range cannot exceed {MaximumQueryRangeDays} days.");
    }
}
