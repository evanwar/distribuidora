using System.Net.Mime;
using Distribuidora.Api.Auth;
using Distribuidora.Api.Common;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Customers;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Customers;

[ApiController, Route("api/v1/customers"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class CustomersController(CustomerService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Catalogs.View)]
    public ActionResult<ApiResponse<IReadOnlyCollection<CustomerResponse>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] int? limit) =>
        Ok(ApiResponse<IReadOnlyCollection<CustomerResponse>>.Ok(
            service.GetAll(search, limit).Select(HttpResponseMapper.Map).ToArray(),
            HttpContext.TraceIdentifier));

    [HttpPost, Authorize(Policy = Permissions.Catalogs.Create)]
    public async Task<ActionResult<ApiResponse<CustomerResponse>>> Create(
        [FromBody] CustomerRequest request,
        CancellationToken cancellationToken)
    {
        var customer = await service.SaveAsync(
            null, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Created(
            $"/api/v1/customers/{customer.Id}",
            ApiResponse<CustomerResponse>.Ok(HttpResponseMapper.Map(customer), HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}"), Authorize(Policy = Permissions.Catalogs.Edit)]
    public async Task<ActionResult<ApiResponse<CustomerResponse>>> Update(
        [FromRoute] Guid id,
        [FromBody] CustomerRequest request,
        CancellationToken cancellationToken)
    {
        var customer = await service.SaveAsync(
            id, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Ok(ApiResponse<CustomerResponse>.Ok(
            HttpResponseMapper.Map(customer), HttpContext.TraceIdentifier));
    }
}
