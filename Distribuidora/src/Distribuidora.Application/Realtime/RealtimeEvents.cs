namespace Distribuidora.Application.Realtime;

public static class RealtimeChannels
{
    public const string Sales = "sales";
    public const string Inventory = "inventory";
    public const string Purchases = "purchases";
    public const string Receivables = "receivables";
    public const string Catalogs = "catalogs";
    public const string PaymentTerminals = "payment-terminals";
    public const string Invoicing = "invoicing";
    public const string Security = "security";
    public const string Logs = "logs";
}

public sealed record RealtimeEvent(
    string EventId,
    string Channel,
    string EventName,
    string EntityName,
    Guid EntityId,
    DateTimeOffset OccurredAt,
    string CorrelationId,
    string OperationId);

public sealed record PersistedEvent(
    string EventId,
    string Type,
    string Payload,
    DateTimeOffset OccurredAt,
    string CorrelationId,
    string OperationId);

public interface IRealtimeEventPublisher
{
    Task PublishAsync(PersistedEvent persistedEvent, CancellationToken cancellationToken);
}
