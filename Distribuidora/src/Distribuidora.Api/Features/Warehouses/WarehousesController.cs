using System.Net.Mime;
using Distribuidora.Api.Auth;
using Distribuidora.Api.Common;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Warehouses;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Warehouses;

[ApiController, Route("api/v1/warehouses"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class WarehousesController(WarehouseService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Catalogs.View)]
    public ActionResult<ApiResponse<IReadOnlyCollection<WarehouseResponse>>> GetAll() =>
        Ok(ApiResponse<IReadOnlyCollection<WarehouseResponse>>.Ok(
            service.GetAll().Select(HttpResponseMapper.Map).ToArray(),
            HttpContext.TraceIdentifier));

    [HttpPost, Authorize(Policy = Permissions.Catalogs.Create)]
    public async Task<ActionResult<ApiResponse<WarehouseResponse>>> Create(
        [FromBody] WarehouseRequest request,
        CancellationToken cancellationToken)
    {
        var warehouse = await service.SaveAsync(
            null, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Created(
            $"/api/v1/warehouses/{warehouse.Id}",
            ApiResponse<WarehouseResponse>.Ok(HttpResponseMapper.Map(warehouse), HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}"), Authorize(Policy = Permissions.Catalogs.Edit)]
    public async Task<ActionResult<ApiResponse<WarehouseResponse>>> Update(
        [FromRoute] Guid id,
        [FromBody] WarehouseRequest request,
        CancellationToken cancellationToken)
    {
        var warehouse = await service.SaveAsync(
            id, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Ok(ApiResponse<WarehouseResponse>.Ok(
            HttpResponseMapper.Map(warehouse), HttpContext.TraceIdentifier));
    }
}
