using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;

namespace Distribuidora.Application.Features.Products.PosProducts;

public interface IPosProductStore
{
    Task<PagedResponse<PosProductResponse>> SearchAsync(PosProductSearchRequest request, Guid userId, CancellationToken ct);
    Task<PagedResponse<PosFacetResponse>> FacetsAsync(PosFacetRequest request, CancellationToken ct);
    Task SetFavoriteAsync(Guid productId, Guid userId, bool favorite, CancellationToken ct);
}
