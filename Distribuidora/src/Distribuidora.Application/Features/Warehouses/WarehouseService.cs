using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Requests;
using Distribuidora.Domain.Catalogs;

namespace Distribuidora.Application.Features.Warehouses;

public sealed class WarehouseService(
    IAppDbContext db,
    AuditEntryService audit)
{
    public IReadOnlyCollection<Warehouse> GetAll() =>
        db.Query(Specification.All<Warehouse>()).OrderBy(x => x.Name).ToArray();

    public async Task<Warehouse> SaveAsync(
        Guid? id,
        WarehouseRequest request,
        Guid actorId,
        string correlationId,
        CancellationToken cancellationToken)
    {
        var warehouse = id is null
            ? new Warehouse { CreatedBy = actorId }
            : db.Query(Specification.Create<Warehouse>(x => x.Id == id)).SingleOrDefault()
              ?? throw new NotFoundException("Warehouse not found.");

        warehouse.Name = request.Name.Trim();
        warehouse.Type = (Distribuidora.Domain.Catalogs.WarehouseType)request.Type;
        warehouse.Active = request.Active;

        if (id is null) db.Add(warehouse);
        audit.Add(id is null ? "Create" : "Update", "catalogs", nameof(Warehouse), warehouse.Id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
        return warehouse;
    }
}
