using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Domain.Audits;

namespace Distribuidora.Application.Features.Audits;

public sealed class AuditEntryService(IAppDbContext db, IDatatimeProvider datetimeProvider)
{
    public void Add(
        string action,
        string module,
        string entityName,
        Guid entityId,
        Guid actorId,
        string correlationId)
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
            CorrelationId = correlationId
        });
    }
}
