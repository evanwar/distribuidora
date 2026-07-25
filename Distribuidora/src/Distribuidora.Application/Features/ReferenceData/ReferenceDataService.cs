using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Requests;
using Distribuidora.Domain.Catalogs;

namespace Distribuidora.Application.Features.ReferenceData;

public sealed class ReferenceDataService(
    IAppDbContext db,
    IDatatimeProvider datetimeProvider,
    AuditEntryService audit)
{
    public IReadOnlyCollection<Category> GetCategories() =>
        db.Query(Specification.All<Category>()).OrderBy(x => x.Name).ToArray();

    public IReadOnlyCollection<Brand> GetBrands() =>
        db.Query(Specification.All<Brand>()).OrderBy(x => x.Name).ToArray();

    public IReadOnlyCollection<Unit> GetUnits() =>
        db.Query(Specification.All<Unit>()).OrderBy(x => x.Name).ToArray();

    public Task<Category> SaveCategoryAsync(Guid? id, NamedCatalogRequest request, Guid actorId, string correlationId, CancellationToken cancellationToken) =>
        SaveNamedAsync<Category>(id, request, actorId, correlationId, cancellationToken);

    public Task<Brand> SaveBrandAsync(Guid? id, NamedCatalogRequest request, Guid actorId, string correlationId, CancellationToken cancellationToken) =>
        SaveNamedAsync<Brand>(id, request, actorId, correlationId, cancellationToken);

    public async Task<Unit> SaveUnitAsync(
        Guid? id,
        UnitRequest request,
        Guid actorId,
        string correlationId,
        CancellationToken cancellationToken)
    {
        var unit = id is null
            ? new Unit { CreatedBy = actorId }
            : db.Query(Specification.Create<Unit>(x => x.Id == id)).SingleOrDefault()
              ?? throw new NotFoundException("Unit not found.");

        unit.Name = request.Name.Trim();
        unit.Abbreviation = request.Abbreviation.Trim();
        unit.AllowsDecimals = request.AllowsDecimals;
        unit.Active = request.Active;
        if (id is null) db.Add(unit);
        audit.Add(id is null ? "Create" : "Update", "catalogs", nameof(Unit), unit.Id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
        return unit;
    }

    private async Task<T> SaveNamedAsync<T>(
        Guid? id,
        NamedCatalogRequest request,
        Guid actorId,
        string correlationId,
        CancellationToken cancellationToken)
        where T : NamedCatalog, new()
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required.");

        var entity = id is null
            ? new T { CreatedBy = actorId }
            : db.Query(Specification.Create<T>(x => x.Id == id)).SingleOrDefault()
              ?? throw new NotFoundException($"{typeof(T).Name} not found.");

        entity.Name = request.Name.Trim();
        entity.Description = request.Description;
        entity.Active = request.Active;
        if (id is null)
            db.Add(entity);
        else
        {
            entity.UpdatedAt = datetimeProvider.UtcNow;
            entity.UpdatedBy = actorId;
        }

        audit.Add(id is null ? "Create" : "Update", "catalogs", typeof(T).Name, entity.Id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
        return entity;
    }
}
