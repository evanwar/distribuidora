namespace Distribuidora.Domain.Common;

public interface IDomainEvent
{
    DateTimeOffset OccurredAt { get; }
}

public abstract record DomainEvent(DateTimeOffset OccurredAt) : IDomainEvent;

public abstract class Entity
{
    private readonly List<IDomainEvent> _domainEvents = [];

    public Guid Id { get; protected set; } = Guid.NewGuid();
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents;

    protected void Raise(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
    public void ClearDomainEvents() => _domainEvents.Clear();
}

public abstract class AuditableEntity : Entity
{
    public DateTimeOffset CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public uint RowVersion { get; set; }
}

public enum DocumentStatus { Draft, Confirmed, Closed, Cancelled }
public enum PaymentCondition { Cash, Credit, Mixed }
public enum ReceivableStatus { Pending, PartiallyPaid, Paid, Cancelled }

public sealed class DomainRuleException(string message) : Exception(message);

public record EntityChangedDomainEvent(
    string EventName,
    string EntityName,
    Guid EntityId,
    DateTimeOffset OccurredAt) : DomainEvent(OccurredAt);
