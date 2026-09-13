using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Specifications;
using Distribuidora.Domain.Audits;
using Distribuidora.Infrastructure.Persistence;
using Distribuidora.Application.Realtime;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Distribuidora.Infrastructure.Observability;

public sealed class OutboxProcessor(
    IServiceScopeFactory scopeFactory,
    ILogger<OutboxProcessor> logger,
    IDatatimeProvider datetimeProvider,
    OutboxWakeSignal wakeSignal) : BackgroundService
{
    private const int BatchSize = 50;
    private const int MaximumRetryAttempts = 10;
    private const int MaximumBackoffExponent = 8;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        do
        {
            var processed = 0;
            try
            {
                processed = await ProcessBatch(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Outbox processing batch failed.");
            }
            if (processed < BatchSize) await wakeSignal.WaitAsync(stoppingToken);
        } while (!stoppingToken.IsCancellationRequested);
    }

    private async Task<int> ProcessBatch(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var messages = await db.Query(Specification.Create<OutboxMessage>(
                x => x.ProcessedAt == null && x.RetryCount < MaximumRetryAttempts))
            .OrderBy(x => x.OccurredAt).Take(BatchSize)
            .ToArrayAsync(ct);
        foreach (var message in messages)
        {
            try
            {
                var publisher = scope.ServiceProvider.GetRequiredService<IRealtimeEventPublisher>();
                await publisher.PublishAsync(new PersistedEvent(
                    message.EventId,
                    message.Type,
                    message.Payload,
                    message.OccurredAt,
                    message.CorrelationId,
                    message.OperationId), ct);
                var eventLog = await db.Query(Specification.Create<SystemEventLog>(
                    x => x.EventId == message.EventId)).SingleAsync(ct);
                var utcNow = datetimeProvider.UtcNow;
                eventLog.Status = SystemEventStatuses.Processed;
                eventLog.AttemptCount = message.RetryCount + 1;
                eventLog.ProcessedAt = utcNow;
                eventLog.LastAttemptAt = utcNow;
                eventLog.Error = null;
                message.ProcessedAt = utcNow;
                message.Error = null;
                await db.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                message.RetryCount++;
                message.Error = ex.GetBaseException().Message;
                var eventLog = await db.Query(Specification.Create<SystemEventLog>(
                    x => x.EventId == message.EventId)).SingleOrDefaultAsync(ct);
                if (eventLog is not null)
                {
                    var utcNow = datetimeProvider.UtcNow;
                    eventLog.Status = message.RetryCount >= MaximumRetryAttempts
                        ? SystemEventStatuses.DeadLetter
                        : SystemEventStatuses.Failed;
                    eventLog.AttemptCount = message.RetryCount;
                    eventLog.LastAttemptAt = utcNow;
                    eventLog.NextAttemptAt = message.RetryCount >= MaximumRetryAttempts
                        ? null
                        : utcNow.AddSeconds(Math.Pow(2, Math.Min(message.RetryCount, MaximumBackoffExponent)));
                    eventLog.Error = ex.GetBaseException().Message;
                }
                await db.SaveChangesAsync(ct);
            }
        }
        return messages.Length;
    }
}
