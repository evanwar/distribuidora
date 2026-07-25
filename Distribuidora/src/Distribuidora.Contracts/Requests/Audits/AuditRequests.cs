namespace Distribuidora.Contracts.Requests;

public sealed record CancellationReasonRequest(string Code, string Description, string Module, bool RequiresAuthorization, bool Active = true);
public sealed record OperationalNoteRequest(string EntityName, Guid EntityId, string Note);
public sealed record AuditLogQuery(
    DateTimeOffset From, DateTimeOffset To, string? Module = null, Guid? UserId = null,
    string? Action = null, string? EntityName = null, Guid? EntityId = null,
    string? OperationId = null, string? TransactionId = null, string? CorrelationId = null,
    string? ReferenceFolio = null, int Page = 1, int PageSize = 50);
