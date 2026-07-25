using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Domain.Catalogs;

namespace Distribuidora.Application.Features.Products;

public sealed class ProductService(
    IAppDbContext db,
    IDatatimeProvider datetimeProvider,
    AuditEntryService audit)
{
    public PagedResponse<Product> Search(string? search, int page, int pageSize)
    {
        var filter = Specification.Create<Product>(x => !x.IsDeleted &&
            (string.IsNullOrWhiteSpace(search) || x.Sku.Contains(search) || x.Name.Contains(search) ||
             (x.Barcode != null && x.Barcode.Contains(search))));
        var total = db.Query(filter).Count();
        var items = db.Query(filter)
            .OrderByDescending(x => x.Active)
            .ThenBy(x => x.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToArray();
        return new(items, page, pageSize, total);
    }

    public Product GetById(Guid id) =>
        db.Query(Specification.Create<Product>(x => x.Id == id && !x.IsDeleted)).SingleOrDefault()
        ?? throw new NotFoundException("Product not found.");

    public async Task<Product> SaveAsync(
        Guid? id,
        ProductRequest request,
        Guid actorId,
        string correlationId,
        CancellationToken cancellationToken)
    {
        var sku = request.Sku.Trim().ToUpperInvariant();
        if (request.Cost < 0 || request.BasePrice < 0 || request.MinimumStock < 0)
            throw new ArgumentException("Amounts cannot be negative.");
        if (db.Query(Specification.Create<Product>(x => x.Sku == sku && x.Id != id)).Any())
            throw new ConflictException("SKU already exists.");
        if (!string.IsNullOrWhiteSpace(request.Barcode) &&
            db.Query(Specification.Create<Product>(x => x.Barcode == request.Barcode && x.Id != id)).Any())
            throw new ConflictException("Barcode already exists.");

        var product = id is null
            ? new Product { CreatedBy = actorId }
            : db.Query(Specification.Create<Product>(x => x.Id == id)).SingleOrDefault()
              ?? throw new NotFoundException("Product not found.");

        product.Sku = sku;
        product.Name = request.Name.Trim();
        product.Description = request.Description;
        product.CategoryId = request.CategoryId;
        product.BrandId = request.BrandId;
        product.UnitId = request.UnitId;
        product.Barcode = string.IsNullOrWhiteSpace(request.Barcode) ? null : request.Barcode.Trim();
        product.Cost = request.Cost;
        product.BasePrice = request.BasePrice;
        product.MinimumStock = request.MinimumStock;
        product.Active = request.Active;

        if (id is null)
            db.Add(product);
        else
        {
            product.UpdatedAt = datetimeProvider.UtcNow;
            product.UpdatedBy = actorId;
        }

        audit.Add(id is null ? "Create" : "Update", "catalogs", nameof(Product), product.Id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
        return product;
    }

    public IReadOnlyCollection<ProductAlias> GetAliases() =>
        db.Query(Specification.All<ProductAlias>()).OrderBy(x => x.Alias).ToArray();

    public async Task<ProductAlias> SaveAliasAsync(
        Guid? id,
        ProductAliasRequest request,
        Guid actorId,
        CancellationToken cancellationToken)
    {
        if (db.Query(Specification.Create<ProductAlias>(
                x => x.ProductId == request.ProductId && x.Alias == request.Alias && x.Id != id)).Any())
            throw new ConflictException("Alias already exists for product.");

        var alias = id is null
            ? new ProductAlias { CreatedBy = actorId }
            : db.Query(Specification.Create<ProductAlias>(x => x.Id == id)).SingleOrDefault()
              ?? throw new NotFoundException("Alias not found.");

        alias.ProductId = request.ProductId;
        alias.Alias = request.Alias.Trim();
        alias.Active = request.Active;
        if (id is null) db.Add(alias);
        await db.SaveChangesAsync(cancellationToken);
        return alias;
    }
}
