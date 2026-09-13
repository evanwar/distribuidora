using System.Net.Mime;
using Distribuidora.Application.Features.Products.PosProducts;
using Distribuidora.Application.Security;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Products;

[ApiController, Route("api/v1/pos-products"), Authorize(Policy = Permissions.Sales.Create), Produces(MediaTypeNames.Application.Json)]
public sealed class PosProductsController(PosProductService service) : ControllerBase
{
    /// <summary>Search active products with warehouse availability, relevance and user favorites. Requires sales.create.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResponse<PosProductResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PagedResponse<PosProductResponse>>>> Search(
        [FromQuery] PosProductSearchRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<PagedResponse<PosProductResponse>>.Ok(await service.SearchAsync(request, cancellationToken), HttpContext.TraceIdentifier));

    /// <summary>Search categories or brands without loading the entire catalog. Requires sales.create.</summary>
    [HttpGet("facets")]
    [ProducesResponseType(typeof(ApiResponse<PagedResponse<PosFacetResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResponse<PosFacetResponse>>>> Facets(
        [FromQuery] PosFacetRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<PagedResponse<PosFacetResponse>>.Ok(await service.FacetsAsync(request, cancellationToken), HttpContext.TraceIdentifier));

    /// <summary>Set the authenticated user's favorite, idempotently. Requires sales.create.</summary>
    [HttpPut("{productId:guid}/favorite")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<bool>>> Favorite(Guid productId,
        [FromBody] ProductFavoriteRequest request, CancellationToken cancellationToken)
    {
        await service.SetFavoriteAsync(productId, request, cancellationToken);
        return Ok(ApiResponse<bool>.Ok(request.Favorite, HttpContext.TraceIdentifier));
    }
}
