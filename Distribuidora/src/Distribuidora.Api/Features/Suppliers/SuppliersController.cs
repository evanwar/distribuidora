using System.Net.Mime;
using Distribuidora.Api.Auth;
using Distribuidora.Api.Common;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Suppliers;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Suppliers;

[ApiController, Route("api/v1/suppliers"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class SuppliersController(SupplierService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Catalogs.View)]
    public ActionResult<ApiResponse<IReadOnlyCollection<SupplierResponse>>> GetAll() =>
        Ok(ApiResponse<IReadOnlyCollection<SupplierResponse>>.Ok(
            service.GetAll().Select(HttpResponseMapper.Map).ToArray(),
            HttpContext.TraceIdentifier));

    [HttpPost, Authorize(Policy = Permissions.Catalogs.Create)]
    public async Task<ActionResult<ApiResponse<SupplierResponse>>> Create(
        [FromBody] SupplierRequest request,
        CancellationToken cancellationToken)
    {
        var supplier = await service.SaveAsync(
            null, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Created(
            $"/api/v1/suppliers/{supplier.Id}",
            ApiResponse<SupplierResponse>.Ok(HttpResponseMapper.Map(supplier), HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}"), Authorize(Policy = Permissions.Catalogs.Edit)]
    public async Task<ActionResult<ApiResponse<SupplierResponse>>> Update(
        [FromRoute] Guid id,
        [FromBody] SupplierRequest request,
        CancellationToken cancellationToken)
    {
        var supplier = await service.SaveAsync(
            id, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Ok(ApiResponse<SupplierResponse>.Ok(
            HttpResponseMapper.Map(supplier), HttpContext.TraceIdentifier));
    }
}
