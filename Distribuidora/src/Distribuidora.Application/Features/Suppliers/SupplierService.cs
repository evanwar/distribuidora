using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Requests;
using Distribuidora.Domain.Catalogs;

namespace Distribuidora.Application.Features.Suppliers;

public sealed class SupplierService(
    IAppDbContext db,
    AuditEntryService audit)
{
    public IReadOnlyCollection<Supplier> GetAll() =>
        db.Query(Specification.All<Supplier>()).OrderBy(x => x.Name).ToArray();

    public async Task<Supplier> SaveAsync(
        Guid? id,
        SupplierRequest request,
        Guid actorId,
        string correlationId,
        CancellationToken cancellationToken)
    {
        var supplier = id is null
            ? new Supplier { CreatedBy = actorId }
            : db.Query(Specification.Create<Supplier>(x => x.Id == id)).SingleOrDefault()
              ?? throw new NotFoundException("Supplier not found.");

        supplier.Name = request.Name.Trim();
        supplier.ContactName = request.ContactName;
        supplier.Phone = request.Phone;
        supplier.Email = request.Email;
        supplier.Address = request.Address;
        supplier.Active = request.Active;

        if (id is null) db.Add(supplier);
        audit.Add(id is null ? "Create" : "Update", "catalogs", nameof(Supplier), supplier.Id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
        return supplier;
    }
}
