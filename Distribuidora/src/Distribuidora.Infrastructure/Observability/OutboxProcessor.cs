using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Specifications;
using Distribuidora.Domain.Audits;
using Distribuidora.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Distribuidora.Infrastructure.Observability;

public sealed class OutboxProcessor(
    IServiceScopeFactory scopeFactory,
    ILogger<OutboxProcessor> logger,
    IDatatimeProvider datetimeProvider) : BackgroundService
{
    private const int PollingIntervalSeconds = 10;
    private const int BatchSize = 50;
    private const int MaximumRetryAttempts = 10;
    private const int MaximumBackoffExponent = 8;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(PollingIntervalSeconds));
        do
        {
            try
            {
                await ProcessBatch(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Outbox processing batch failed.");
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task ProcessBatch(CancellationToken ct)
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
    }
}
