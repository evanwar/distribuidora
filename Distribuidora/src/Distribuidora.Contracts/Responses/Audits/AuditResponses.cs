namespace Distribuidora.Contracts.Responses;

public sealed record AuditLogResponse(
    Guid Id, Guid? UserId, string Action, string Module, string EntityName, Guid? EntityId,
    string? BeforeData, string? AfterData, string? IpAddress, string CorrelationId,
    string OperationId, string TransactionId, string? TraceId, string? EventId,
    string? CausationId, string? ReferenceFolio, DateTimeOffset OccurredAt);
public sealed record CancellationReasonResponse(Guid Id, string Code, string Description, string Module, bool RequiresAuthorization, bool Active);
public sealed record OperationalNoteResponse(Guid Id, string EntityName, Guid EntityId, string Note, Guid CreatedBy, DateTimeOffset CreatedAt);
