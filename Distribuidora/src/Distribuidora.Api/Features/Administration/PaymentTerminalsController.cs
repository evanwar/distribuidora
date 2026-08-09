using System.Net.Mime;
using Distribuidora.Api.Auth;
using Distribuidora.Api.Common;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Administration;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Administration;

[ApiController]
[Route("api/v1/admin/payment-terminals")]
[Authorize]
[Produces(MediaTypeNames.Application.Json)]
public sealed class PaymentTerminalsController(
    PaymentTerminalService service,
    ICurrentUser currentUser) : ControllerBase
{
    /// <summary>Lists every registered Mercado Pago Point terminal for administration.</summary>
    [HttpGet]
    [Authorize(Policy = Permissions.Administration.ViewPaymentTerminals)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<PaymentTerminalResponse>>), StatusCodes.Status200OK)]
    public ActionResult<ApiResponse<IReadOnlyCollection<PaymentTerminalResponse>>> GetAll() =>
        Ok(ApiResponse<IReadOnlyCollection<PaymentTerminalResponse>>.Ok(
            service.GetAll().Select(HttpResponseMapper.Map).ToArray(),
            HttpContext.TraceIdentifier));

    /// <summary>Lists active terminals that can receive a Point payment.</summary>
    [HttpGet("available")]
    [Authorize(Policy = Permissions.Sales.RegisterPayment)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<PaymentTerminalResponse>>), StatusCodes.Status200OK)]
    public ActionResult<ApiResponse<IReadOnlyCollection<PaymentTerminalResponse>>> GetAvailable() =>
        Ok(ApiResponse<IReadOnlyCollection<PaymentTerminalResponse>>.Ok(
            service.GetAvailable().Select(HttpResponseMapper.Map).ToArray(),
            HttpContext.TraceIdentifier));

    /// <summary>Gets one registered payment terminal.</summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = Permissions.Administration.ViewPaymentTerminals)]
    [ProducesResponseType(typeof(ApiResponse<PaymentTerminalResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<ApiResponse<PaymentTerminalResponse>> GetById([FromRoute] Guid id) =>
        Ok(ApiResponse<PaymentTerminalResponse>.Ok(
            HttpResponseMapper.Map(service.GetById(id)),
            HttpContext.TraceIdentifier));

    /// <summary>Registers a Mercado Pago Point terminal.</summary>
    [HttpPost]
    [Authorize(Policy = Permissions.Administration.ManagePaymentTerminals)]
    [ProducesResponseType(typeof(ApiResponse<PaymentTerminalResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<PaymentTerminalResponse>>> Create(
        [FromBody] PaymentTerminalRequest request,
        CancellationToken cancellationToken)
    {
        var result = await service.SaveAsync(
            null, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<PaymentTerminalResponse>.Ok(
                HttpResponseMapper.Map(result), HttpContext.TraceIdentifier));
    }

    /// <summary>Updates a registered Mercado Pago Point terminal.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = Permissions.Administration.ManagePaymentTerminals)]
    [ProducesResponseType(typeof(ApiResponse<PaymentTerminalResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<PaymentTerminalResponse>>> Update(
        [FromRoute] Guid id,
        [FromBody] PaymentTerminalRequest request,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse<PaymentTerminalResponse>.Ok(
            HttpResponseMapper.Map(await service.SaveAsync(
                id, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken)),
            HttpContext.TraceIdentifier));

    /// <summary>Activates a payment terminal so it can receive new charges.</summary>
    [HttpPost("{id:guid}/activate")]
    [Authorize(Policy = Permissions.Administration.ManagePaymentTerminals)]
    [ProducesResponseType(typeof(ApiResponse<PaymentTerminalResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ActionResult<ApiResponse<PaymentTerminalResponse>>> Activate(
        [FromRoute] Guid id,
        CancellationToken cancellationToken) =>
        SetActive(id, true, cancellationToken);

    /// <summary>Logically deactivates a terminal after verifying that it has no active Point order.</summary>
    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Policy = Permissions.Administration.ManagePaymentTerminals)]
    [ProducesResponseType(typeof(ApiResponse<PaymentTerminalResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public Task<ActionResult<ApiResponse<PaymentTerminalResponse>>> Deactivate(
        [FromRoute] Guid id,
        CancellationToken cancellationToken) =>
        SetActive(id, false, cancellationToken);

    private async Task<ActionResult<ApiResponse<PaymentTerminalResponse>>> SetActive(
        Guid id,
        bool active,
        CancellationToken cancellationToken)
    {
        var result = await service.SetActiveAsync(
            id, active, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Ok(ApiResponse<PaymentTerminalResponse>.Ok(
            HttpResponseMapper.Map(result), HttpContext.TraceIdentifier));
    }
}
