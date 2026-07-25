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

[ApiController, Route("api/v1/product-aliases"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class ProductAliasesController(ProductService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Catalogs.View)]
    public ActionResult<ApiResponse<IReadOnlyCollection<ProductAliasResponse>>> GetAll() =>
        Ok(ApiResponse<IReadOnlyCollection<ProductAliasResponse>>.Ok(
            service.GetAliases().Select(HttpResponseMapper.Map).ToArray(),
            HttpContext.TraceIdentifier));

    [HttpPost, Authorize(Policy = Permissions.Catalogs.Create)]
    public async Task<ActionResult<ApiResponse<ProductAliasResponse>>> Create(
        [FromBody] ProductAliasRequest request,
        CancellationToken cancellationToken)
    {
        var alias = await service.SaveAliasAsync(null, request, currentUser.Id, cancellationToken);
        return Created(
            $"/api/v1/product-aliases/{alias.Id}",
            ApiResponse<ProductAliasResponse>.Ok(HttpResponseMapper.Map(alias), HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}"), Authorize(Policy = Permissions.Catalogs.Edit)]
    public async Task<ActionResult<ApiResponse<ProductAliasResponse>>> Update(
        [FromRoute] Guid id,
        [FromBody] ProductAliasRequest request,
        CancellationToken cancellationToken)
    {
        var alias = await service.SaveAliasAsync(id, request, currentUser.Id, cancellationToken);
        return Ok(ApiResponse<ProductAliasResponse>.Ok(
            HttpResponseMapper.Map(alias), HttpContext.TraceIdentifier));
    }
}
