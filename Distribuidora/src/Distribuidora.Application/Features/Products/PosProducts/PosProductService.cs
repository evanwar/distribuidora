using Distribuidora.Application.Abstractions;
using Distribuidora.Contracts.Requests;
using FluentValidation;

namespace Distribuidora.Application.Features.Products.PosProducts;

public sealed class PosProductService(IPosProductStore store, ICurrentUser user)
{
    public async Task<Distribuidora.Contracts.Common.PagedResponse<Distribuidora.Contracts.Responses.PosProductResponse>> SearchAsync(
        PosProductSearchRequest request, CancellationToken ct)
    {
        await new PosProductSearchValidator().ValidateAndThrowAsync(request, ct);
        return await store.SearchAsync(request, user.Id, ct);
    }

    public async Task<Distribuidora.Contracts.Common.PagedResponse<Distribuidora.Contracts.Responses.PosFacetResponse>> FacetsAsync(
        PosFacetRequest request, CancellationToken ct)
    {
        await new PosFacetValidator().ValidateAndThrowAsync(request, ct);
        return await store.FacetsAsync(request, ct);
    }

    public Task SetFavoriteAsync(Guid productId, ProductFavoriteRequest request, CancellationToken ct) =>
        store.SetFavoriteAsync(productId, user.Id, request.Favorite, ct);
}

public sealed class PosProductSearchValidator : AbstractValidator<PosProductSearchRequest>
{
    public PosProductSearchValidator()
    {
        RuleFor(x => x.WarehouseId).NotEmpty();
        RuleFor(x => x.Search).MaximumLength(160);
        RuleFor(x => x.Page).InclusiveBetween(1, 100000);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 50);
        RuleFor(x => x.MinimumPrice).GreaterThanOrEqualTo(0);
        RuleFor(x => x.MaximumPrice).GreaterThanOrEqualTo(0);
        RuleFor(x => x).Must(x => !x.MinimumPrice.HasValue || !x.MaximumPrice.HasValue || x.MinimumPrice <= x.MaximumPrice)
            .WithMessage("Minimum price cannot exceed maximum price.");
        RuleFor(x => x.Search).NotEmpty().When(x => x.ExactBarcode);
        RuleFor(x => x.ProductIds).Must(ids => ids is null || ids.Length <= 50).WithMessage("At most 50 product IDs are allowed.");
    }
}

public sealed class PosFacetValidator : AbstractValidator<PosFacetRequest>
{
    public PosFacetValidator()
    {
        RuleFor(x => x.Kind).Must(x => x is "category" or "brand");
        RuleFor(x => x.Search).MaximumLength(160);
        RuleFor(x => x.Page).InclusiveBetween(1, 100000);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 50);
    }
}
