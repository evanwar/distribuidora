using System.Net.Mime;
using Distribuidora.Api.Auth;
using Distribuidora.Api.Common;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Products;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Products;

[ApiController, Route("api/v1/products"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class ProductsController(ProductService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Catalogs.View)]
    public ActionResult<ApiResponse<PagedResponse<ProductResponse>>> Search([FromQuery] ProductSearchRequest request)
    {
        var result = service.Search(request.Search, Math.Max(request.Page, 1), Math.Clamp(request.PageSize, 1, 100));
        var response = new PagedResponse<ProductResponse>(
            result.Items.Select(HttpResponseMapper.Map).ToArray(),
            result.Page,
            result.PageSize,
            result.Total);
        return Ok(ApiResponse<PagedResponse<ProductResponse>>.Ok(response, HttpContext.TraceIdentifier));
    }

    [HttpGet("{id:guid}"), Authorize(Policy = Permissions.Catalogs.View)]
    public ActionResult<ApiResponse<ProductResponse>> GetById([FromRoute] Guid id) =>
        Ok(ApiResponse<ProductResponse>.Ok(
            HttpResponseMapper.Map(service.GetById(id)), HttpContext.TraceIdentifier));

    [HttpPost, Authorize(Policy = Permissions.Catalogs.Create)]
    [ProducesResponseType(typeof(ApiResponse<ProductResponse>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<ProductResponse>>> Create(
        [FromBody] ProductRequest request,
        CancellationToken cancellationToken)
    {
        var product = await service.SaveAsync(
            null, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = product.Id },
            ApiResponse<ProductResponse>.Ok(
                HttpResponseMapper.Map(product),
                HttpContext.TraceIdentifier,
                "Product created successfully."));
    }

    [HttpPut("{id:guid}"), Authorize(Policy = Permissions.Catalogs.Edit)]
    public async Task<ActionResult<ApiResponse<ProductResponse>>> Update(
        [FromRoute] Guid id,
        [FromBody] ProductRequest request,
        CancellationToken cancellationToken)
    {
        var product = await service.SaveAsync(
            id, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Ok(ApiResponse<ProductResponse>.Ok(
            HttpResponseMapper.Map(product), HttpContext.TraceIdentifier));
    }
}
