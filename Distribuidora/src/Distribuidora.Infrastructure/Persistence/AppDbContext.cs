using System.Text.Json;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Specifications;
using Distribuidora.Domain.AccountsReceivable;
using Distribuidora.Domain.Administration;
using Distribuidora.Domain.Audits;
using Distribuidora.Domain.Catalogs;
using Distribuidora.Domain.Common;
using Distribuidora.Domain.Inventory;
using Distribuidora.Domain.Purchases;
using Distribuidora.Domain.Sales;
using Distribuidora.Domain.Security;
using Microsoft.EntityFrameworkCore;

namespace Distribuidora.Infrastructure.Persistence;

public sealed class AppDbContext(
    DbContextOptions<AppDbContext> options,
    IRequestTraceContext trace,
    ISensitiveDataSanitizer sanitizer,
    IDatatimeProvider datetimeProvider) : DbContext(options), IAppDbContext
{
    private DbSet<AuditLog> AuditLogSet => Set<AuditLog>();
    private DbSet<SystemEventLog> SystemEventLogSet => Set<SystemEventLog>();
    private DbSet<OutboxMessage> OutboxMessageSet => Set<OutboxMessage>();

    public IQueryable<TEntity> Query<TEntity>(Specification<TEntity> specification)
        where TEntity : class =>
        Set<TEntity>().Where(specification.ToExpression());

    void IAppDbContext.Add<T>(T entity) => Set<T>().Add(entity);
    void IAppDbContext.Remove<T>(T entity) => Set<T>().Remove(entity);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyTimestamps();
        trace.CorrelationId = RequiredId(trace.CorrelationId);
        trace.OperationId = RequiredId(trace.OperationId);
        trace.TransactionId ??= Guid.NewGuid().ToString();
        foreach (var entry in ChangeTracker.Entries<AuditLog>())
        {
            entry.Entity.CorrelationId = RequiredId(entry.Entity.CorrelationId, trace.CorrelationId);
            entry.Entity.OperationId = RequiredId(entry.Entity.OperationId, trace.OperationId);
            entry.Entity.TransactionId = RequiredId(entry.Entity.TransactionId, trace.TransactionId);
            entry.Entity.TraceId ??= trace.TraceId;
            entry.Entity.BeforeData = sanitizer.SanitizeJson(entry.Entity.BeforeData);
            entry.Entity.AfterData = sanitizer.SanitizeJson(entry.Entity.AfterData);
            entry.Entity.ChangedProperties = sanitizer.SanitizeJson(entry.Entity.ChangedProperties);
        }
        foreach (var entry in ChangeTracker.Entries<InventoryMovement>())
        {
            entry.Entity.CorrelationId = RequiredId(entry.Entity.CorrelationId, trace.CorrelationId);
            entry.Entity.OperationId = RequiredId(entry.Entity.OperationId, trace.OperationId);
            entry.Entity.TransactionId = RequiredId(entry.Entity.TransactionId, trace.TransactionId);
        }
        var events = ChangeTracker.Entries<Entity>()
            .SelectMany(x => x.Entity.DomainEvents)
            .ToArray();
        var causationId = trace.CausationId;
        foreach (var domainEvent in events)
        {
            var eventId = Guid.NewGuid().ToString();
            var payload = sanitizer.SanitizeJson(JsonSerializer.Serialize(domainEvent, domainEvent.GetType())) ?? "{}";
            OutboxMessageSet.Add(new OutboxMessage
            {
                EventId = eventId,
                OccurredAt = domainEvent.OccurredAt,
                Type = domainEvent.GetType().FullName ?? domainEvent.GetType().Name,
                Payload = payload,
                CorrelationId = trace.CorrelationId,
                OperationId = trace.OperationId,
                TraceId = trace.TraceId,
                TransactionId = trace.TransactionId,
                CausationId = causationId
            });
            SystemEventLogSet.Add(new SystemEventLog
            {
                EventId = eventId,
                EventName = domainEvent.GetType().FullName ?? domainEvent.GetType().Name,
                Payload = payload,
                Status = SystemEventStatuses.Pending,
                CreatedAt = domainEvent.OccurredAt,
                CorrelationId = trace.CorrelationId,
                OperationId = trace.OperationId,
                TraceId = trace.TraceId,
                TransactionId = trace.TransactionId,
                CausationId = causationId
            });
            causationId = eventId;
        }
        var result = await base.SaveChangesAsync(cancellationToken);
        foreach (var entry in ChangeTracker.Entries<Entity>()) entry.Entity.ClearDomainEvents();
        return result;
    }

    public async Task<T> ExecuteAtomicAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken = default)
    {
        if (Database.CurrentTransaction is not null) return await action(cancellationToken);
        await using var transaction = await Database.BeginTransactionAsync(cancellationToken);
        var previousTransactionId = trace.TransactionId;
        trace.TransactionId = transaction.TransactionId.ToString();
        try
        {
            var result = await action(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return result;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
        finally
        {
            trace.TransactionId = previousTransactionId;
        }
    }

    private static string RequiredId(string? value, string? fallback = null) =>
        !string.IsNullOrWhiteSpace(value) ? value : !string.IsNullOrWhiteSpace(fallback) ? fallback : Guid.NewGuid().ToString("N");

    private void ApplyTimestamps()
    {
        var utcNow = datetimeProvider.UtcNow;
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>().Where(x => x.State == EntityState.Added))
            if (entry.Entity.CreatedAt == default) entry.Entity.CreatedAt = utcNow;
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>().Where(x => x.State == EntityState.Modified))
            entry.Entity.RowVersion++;
        foreach (var entry in ChangeTracker.Entries<RefreshToken>().Where(x => x.State == EntityState.Modified))
            entry.Entity.RowVersion++;

        foreach (var entry in ChangeTracker.Entries<AuditLog>().Where(x => x.State == EntityState.Added))
        {
            if (entry.Entity.OccurredAt == default) entry.Entity.OccurredAt = utcNow;
            if (entry.Entity.CreatedAt == default) entry.Entity.CreatedAt = utcNow;
        }

        foreach (var entry in ChangeTracker.Entries<OperationalNote>().Where(x => x.State == EntityState.Added))
            if (entry.Entity.CreatedAt == default) entry.Entity.CreatedAt = utcNow;

        foreach (var entry in ChangeTracker.Entries<CreditLimitHistory>().Where(x => x.State == EntityState.Added))
            if (entry.Entity.CreatedAt == default) entry.Entity.CreatedAt = utcNow;

        foreach (var entry in ChangeTracker.Entries<InventoryMovement>().Where(x => x.State == EntityState.Added))
            if (entry.Entity.Date == default) entry.Entity.Date = utcNow;

        foreach (var entry in ChangeTracker.Entries<PurchaseOrder>().Where(x => x.State == EntityState.Added))
            if (entry.Entity.Date == default) entry.Entity.Date = utcNow;

        foreach (var entry in ChangeTracker.Entries<GoodsReceipt>().Where(x => x.State == EntityState.Added))
            if (entry.Entity.ReceivedAt == default) entry.Entity.ReceivedAt = utcNow;

        foreach (var entry in ChangeTracker.Entries<CounterSale>().Where(x => x.State == EntityState.Added))
            if (entry.Entity.SaleDate == default) entry.Entity.SaleDate = utcNow;

        foreach (var entry in ChangeTracker.Entries<SalePayment>().Where(x => x.State == EntityState.Added))
            if (entry.Entity.PaymentDate == default) entry.Entity.PaymentDate = utcNow;

        foreach (var entry in ChangeTracker.Entries<CustomerPayment>().Where(x => x.State == EntityState.Added))
            if (entry.Entity.PaymentDate == default) entry.Entity.PaymentDate = utcNow;
    }
}
