using System.Net.Mime;
using Distribuidora.Api.Auth;
using Distribuidora.Api.Common;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Receivables;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Receivables;

[ApiController, Route("api/v1/accounts-receivable"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class AccountsReceivableController(ReceivablesService service) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Receivables.View)]
    public ActionResult<ApiResponse<IReadOnlyCollection<AccountReceivableResponse>>> GetAll([FromQuery] Guid? customerId) =>
        Ok(ApiResponse<IReadOnlyCollection<AccountReceivableResponse>>.Ok(service.GetReceivables(customerId).Select(HttpResponseMapper.Map).ToArray(), HttpContext.TraceIdentifier));

    [HttpGet("{id:guid}"), Authorize(Policy = Permissions.Receivables.View)]
    public ActionResult<ApiResponse<AccountReceivableResponse>> GetById([FromRoute] Guid id) =>
        Ok(ApiResponse<AccountReceivableResponse>.Ok(HttpResponseMapper.Map(service.GetReceivable(id)), HttpContext.TraceIdentifier));

    [HttpGet("/api/v1/customers/{customerId:guid}/statement"), Authorize(Policy = Permissions.Receivables.View)]
    public ActionResult<ApiResponse<CustomerStatementResponse>> GetStatement([FromRoute] Guid customerId)
    {
        var x = service.GetCustomerStatement(customerId);
        var response = new CustomerStatementResponse(x.CustomerId, x.Receivables.Select(HttpResponseMapper.Map).ToArray(), x.Payments.Select(HttpResponseMapper.Map).ToArray(), x.Balance);
        return Ok(ApiResponse<CustomerStatementResponse>.Ok(response, HttpContext.TraceIdentifier));
    }
}

[ApiController, Route("api/v1/customer-payments"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class CustomerPaymentsController(ReceivablesService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpPost, Authorize(Policy = Permissions.Receivables.RegisterPayment)]
    public async Task<ActionResult<ApiResponse<CustomerPaymentResponse>>> Register([FromBody] CustomerPaymentRequest request, CancellationToken cancellationToken)
    {
        var result = await service.RegisterPaymentAsync(request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Created($"/api/v1/customer-payments/{result.Id}", ApiResponse<CustomerPaymentResponse>.Ok(HttpResponseMapper.Map(result), HttpContext.TraceIdentifier));
    }

    [HttpPost("{id:guid}/apply"), Authorize(Policy = Permissions.Receivables.ApplyPayment)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Apply([FromRoute] Guid id, [FromBody] ApplyPaymentRequest request, CancellationToken cancellationToken)
    {
        await service.ApplyPaymentAsync(id, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/cancel"), Authorize(Policy = Permissions.Receivables.CancelPayment)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Cancel([FromRoute] Guid id, [FromBody] CancelRequest request, CancellationToken cancellationToken)
    {
        await service.CancelPaymentAsync(id, request.Reason, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return NoContent();
    }

    [HttpPost("/api/v1/customers/{customerId:guid}/credit-limit"), Authorize(Policy = Permissions.Receivables.ChangeCreditLimit)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ChangeCreditLimit([FromRoute] Guid customerId, [FromBody] ChangeCreditLimitRequest request, CancellationToken cancellationToken)
    {
        await service.ChangeCreditLimitAsync(customerId, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return NoContent();
    }
}
