using System.Net.Mime;
using Distribuidora.Api.Auth;
using Distribuidora.Api.Common;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Sales;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Sales;

[ApiController, Route("api/v1/counter-sales"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class SalesController(SalesService service, PointPaymentService pointPayments, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Sales.View)]
    public ActionResult<ApiResponse<IReadOnlyCollection<CounterSaleResponse>>> GetAll() =>
        Ok(ApiResponse<IReadOnlyCollection<CounterSaleResponse>>.Ok(service.GetAll().Select(HttpResponseMapper.Map).ToArray(), HttpContext.TraceIdentifier));

    [HttpGet("{id:guid}"), Authorize(Policy = Permissions.Sales.View)]
    public ActionResult<ApiResponse<CounterSaleResponse>> GetById([FromRoute] Guid id) =>
        Ok(ApiResponse<CounterSaleResponse>.Ok(HttpResponseMapper.Map(service.GetById(id)), HttpContext.TraceIdentifier));

    [HttpPost, Authorize(Policy = Permissions.Sales.Create)]
    public async Task<ActionResult<ApiResponse<CounterSaleResponse>>> Create([FromBody] CreateSaleRequest request, CancellationToken cancellationToken)
    {
        var result = await service.CreateAsync(request, currentUser.Id, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<CounterSaleResponse>.Ok(HttpResponseMapper.Map(result), HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}"), Authorize(Policy = Permissions.Sales.EditDraft)]
    public async Task<ActionResult<ApiResponse<CounterSaleResponse>>> Update([FromRoute] Guid id, [FromBody] CreateSaleRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<CounterSaleResponse>.Ok(HttpResponseMapper.Map(await service.UpdateAsync(id, request, currentUser.Id, cancellationToken)), HttpContext.TraceIdentifier));

    [HttpPost("{id:guid}/confirm"), Authorize(Policy = Permissions.Sales.Confirm)]
    public async Task<ActionResult<ApiResponse<CounterSaleResponse>>> Confirm([FromRoute] Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<CounterSaleResponse>.Ok(HttpResponseMapper.Map(await service.ConfirmAsync(id, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken)), HttpContext.TraceIdentifier));

    [HttpPost("{id:guid}/payments"), Authorize(Policy = Permissions.Sales.RegisterPayment)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RegisterPayment([FromRoute] Guid id, [FromBody] SalePaymentRequest request, CancellationToken cancellationToken)
    {
        await service.RegisterPaymentAsync(id, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/cancel"), Authorize(Policy = Permissions.Sales.Cancel)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Cancel([FromRoute] Guid id, [FromBody] CancelRequest request, CancellationToken cancellationToken)
    {
        await service.CancelAsync(id, request.Reason, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return NoContent();
    }

    [HttpGet("{id:guid}/summary"), Authorize(Policy = Permissions.Sales.View)]
    public ActionResult<ApiResponse<CounterSaleResponse>> Summary([FromRoute] Guid id) => GetById(id);

    [HttpGet("{id:guid}/print"), Authorize(Policy = Permissions.Sales.View)]
    public ActionResult<ApiResponse<CounterSaleResponse>> Print([FromRoute] Guid id) => GetById(id);

    [HttpPost("{id:guid}/card-payment"), Authorize(Policy = Permissions.Sales.RegisterPayment)]
    public async Task<ActionResult<ApiResponse<PointCardPaymentResponse>>> StartCardPayment(
        [FromRoute] Guid id,
        [FromBody] StartPointCardPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var payment = await pointPayments.StartAsync(
            id, request.Amount, request.PaymentTerminalId, currentUser.Id,
            HttpContext.TraceIdentifier, cancellationToken);
        return Ok(ApiResponse<PointCardPaymentResponse>.Ok(
            HttpResponseMapper.Map(payment), HttpContext.TraceIdentifier,
            "Payment sent to the Mercado Pago Point terminal."));
    }

    [HttpGet("{id:guid}/card-payment"), Authorize(Policy = Permissions.Sales.View)]
    public async Task<ActionResult<ApiResponse<PointCardPaymentResponse>>> GetCardPayment(
        [FromRoute] Guid id,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse<PointCardPaymentResponse>.Ok(
            HttpResponseMapper.Map(await pointPayments.RefreshForSaleAsync(
                id, currentUser.Id, cancellationToken)),
            HttpContext.TraceIdentifier));

    /// <summary>Cancels an outstanding Mercado Pago Point order and releases the terminal.</summary>
    [HttpPost("{id:guid}/card-payment/cancel"), Authorize(Policy = Permissions.Sales.RegisterPayment)]
    [ProducesResponseType(typeof(ApiResponse<PointCardPaymentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<PointCardPaymentResponse>>> CancelCardPayment(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var payment = await pointPayments.CancelAsync(
            id, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Ok(ApiResponse<PointCardPaymentResponse>.Ok(
            HttpResponseMapper.Map(payment), HttpContext.TraceIdentifier,
            "Payment cancelled and Point terminal released."));
    }
}

[ApiController, Route("api/v1/payments/mercado-pago"), Produces(MediaTypeNames.Application.Json)]
public sealed class MercadoPagoWebhooksController(PointPaymentService pointPayments) : ControllerBase
{
    private const string OrderNotificationType = "order";

    [AllowAnonymous]
    [HttpPost("webhook")]
    public async Task<IActionResult> Receive(
        [FromQuery(Name = "data.id")] string dataId,
        [FromHeader(Name = "x-signature")] string signature,
        [FromHeader(Name = "x-request-id")] string requestId,
        [FromBody] MercadoPagoWebhookRequest request,
        CancellationToken cancellationToken)
    {
        if (!string.Equals(request.Type, OrderNotificationType, StringComparison.OrdinalIgnoreCase) ||
            (request.Data?.Id is not null && !string.Equals(request.Data.Id, dataId, StringComparison.Ordinal)))
            return BadRequest();
        await pointPayments.HandleWebhookAsync(
            signature, requestId, dataId, request.ApplicationId, cancellationToken);
        return Ok();
    }
}
