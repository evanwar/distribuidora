using Distribuidora.Domain.Common;

namespace Distribuidora.Domain.Audits;

public static class SystemEventStatuses
{
    public const string Pending = "Pending";
    public const string Processed = "Processed";
    public const string Failed = "Failed";
    public const string DeadLetter = "DeadLetter";
}

public sealed class AuditLog : Entity
{
    public DateTimeOffset OccurredAt { get; set; }
    public Guid? UserId { get; set; }
    public string? ActorIdentifier { get; set; }
    public string Action { get; set; } = "";
    public string Module { get; set; } = "";
    public string EntityName { get; set; } = "";
    public Guid? EntityId { get; set; }
    public string? ReferenceType { get; set; }
    public string? ReferenceId { get; set; }
    public string? ReferenceFolio { get; set; }
    public string? BeforeData { get; set; }
    public string? AfterData { get; set; }
    public string? ChangedProperties { get; set; }
    public string? Reason { get; set; }
    public string? IpAddress { get; set; }
    public string CorrelationId { get; set; } = "";
    public string OperationId { get; set; } = "";
    public string? TraceId { get; set; }
    public string TransactionId { get; set; } = "";
    public string? EventId { get; set; }
    public string? CausationId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class UserActivityLog : Entity
{
    public DateTimeOffset OccurredAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public Guid? UserId { get; set; }
    public string? ActorIdentifier { get; set; }
    public string? SessionId { get; set; }
    public string ActivityType { get; set; } = "HttpRequest";
    public string Module { get; set; } = "unknown";
    public string Action { get; set; } = "UNKNOWN";
    public string? HttpMethod { get; set; }
    public string? RouteTemplate { get; set; }
    public string? RequestPath { get; set; }
    public int? ResponseStatusCode { get; set; }
    public long? DurationMs { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string CorrelationId { get; set; } = "";
    public string OperationId { get; set; } = "";
    public string? TraceId { get; set; }
    public string? RequestId { get; set; }
    public string? TransactionId { get; set; }
    public string? CausationId { get; set; }
    public string? ReferenceType { get; set; }
    public string? ReferenceId { get; set; }
    public string? ReferenceFolio { get; set; }
    public string? EntityName { get; set; }
    public string? EntityId { get; set; }
    public string? RequestSummary { get; set; }
    public string? ResultSummary { get; set; }
    public bool Succeeded { get; set; }
    public string? FailureCode { get; set; }
}

public sealed class SystemErrorLog : Entity
{
    public DateTimeOffset OccurredAt { get; set; }
    public string Severity { get; set; } = "Error";
    public string? ErrorCode { get; set; }
    public string ExceptionType { get; set; } = "";
    public string Message { get; set; } = "";
    public string? StackTrace { get; set; }
    public string? InnerException { get; set; }
    public string? Source { get; set; }
    public string? Module { get; set; }
    public string? HandlerName { get; set; }
    public string? ControllerName { get; set; }
    public string? HttpMethod { get; set; }
    public string? RequestPath { get; set; }
    public int? ResponseStatusCode { get; set; }
    public Guid? UserId { get; set; }
    public string? ActorIdentifier { get; set; }
    public string? IpAddress { get; set; }
    public string CorrelationId { get; set; } = "";
    public string OperationId { get; set; } = "";
    public string? TraceId { get; set; }
    public string? RequestId { get; set; }
    public string? TransactionId { get; set; }
    public string? EventId { get; set; }
    public string? CausationId { get; set; }
    public string? ReferenceType { get; set; }
    public string? ReferenceId { get; set; }
    public string? ReferenceFolio { get; set; }
    public string Environment { get; set; } = "";
    public string? ApplicationVersion { get; set; }
    public string? HostName { get; set; }
    public string? ContextData { get; set; }
    public bool IsResolved { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public Guid? ResolvedBy { get; set; }
    public string? ResolutionNotes { get; set; }
    public int OccurrenceCount { get; set; } = 1;
    public string? Fingerprint { get; set; }
}

public sealed class CancellationReason : AuditableEntity
{
    public string Code { get; set; } = "";
    public string Description { get; set; } = "";
    public string Module { get; set; } = "";
    public bool RequiresAuthorization { get; set; }
    public bool Active { get; set; } = true;
}

public sealed class OperationalNote : Entity
{
    public string EntityName { get; set; } = "";
    public Guid EntityId { get; set; }
    public string Note { get; set; } = "";
    public Guid CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class SystemEventLog : Entity
{
    public string EventId { get; set; } = "";
    public string EventName { get; set; } = "";
    public string? AggregateType { get; set; }
    public string? AggregateId { get; set; }
    public string Payload { get; set; } = "";
    public int AttemptCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ProcessedAt { get; set; }
    public DateTimeOffset? LastAttemptAt { get; set; }
    public DateTimeOffset? NextAttemptAt { get; set; }
    public string Status { get; set; } = SystemEventStatuses.Pending;
    public string? Error { get; set; }
    public string CorrelationId { get; set; } = "";
    public string OperationId { get; set; } = "";
    public string? TraceId { get; set; }
    public string? TransactionId { get; set; }
    public string? CausationId { get; set; }
    public string? ReferenceType { get; set; }
    public string? ReferenceId { get; set; }
    public string? ReferenceFolio { get; set; }
}

public sealed class OutboxMessage : Entity
{
    public string EventId { get; set; } = "";
    public DateTimeOffset OccurredAt { get; set; }
    public string Type { get; set; } = "";
    public string Payload { get; set; } = "";
    public DateTimeOffset? ProcessedAt { get; set; }
    public string? Error { get; set; }
    public int RetryCount { get; set; }
    public string CorrelationId { get; set; } = "";
    public string OperationId { get; set; } = "";
    public string? TraceId { get; set; }
    public string? TransactionId { get; set; }
    public string? CausationId { get; set; }
}
