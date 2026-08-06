using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Domain.Audits;
using System.Text.Json;

namespace Distribuidora.Application.Features.Audits;

public sealed class AuditEntryService(IAppDbContext db, IDatatimeProvider datetimeProvider)
{
    public void Add(
        string action,
        string module,
        string entityName,
        Guid entityId,
        Guid actorId,
        string correlationId,
        object? before = null,
        object? after = null,
        string? reason = null)
    {
        var utcNow = datetimeProvider.UtcNow;
        db.Add(new AuditLog
        {
            OccurredAt = utcNow,
            CreatedAt = utcNow,
            UserId = actorId,
            Action = AuditActionName.For(entityName, action),
            Module = module,
            EntityName = entityName,
            EntityId = entityId,
            CorrelationId = correlationId,
            BeforeData = before is null ? null : JsonSerializer.Serialize(before),
            AfterData = after is null ? null : JsonSerializer.Serialize(after),
            Reason = reason
        });
    }
}
