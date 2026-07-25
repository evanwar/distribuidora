using System.Net.Mime;
using Distribuidora.Api.Auth;
using Distribuidora.Api.Common;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Purchases;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Purchases;

[ApiController, Route("api/v1/purchases"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class PurchasesController(PurchaseService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Purchases.View)]
    public ActionResult<ApiResponse<IReadOnlyCollection<PurchaseResponse>>> GetAll() =>
        Ok(ApiResponse<IReadOnlyCollection<PurchaseResponse>>.Ok(service.GetPurchases().Select(HttpResponseMapper.Map).ToArray(), HttpContext.TraceIdentifier));

    [HttpGet("{id:guid}"), Authorize(Policy = Permissions.Purchases.View)]
    public ActionResult<ApiResponse<PurchaseResponse>> GetById([FromRoute] Guid id) =>
        Ok(ApiResponse<PurchaseResponse>.Ok(HttpResponseMapper.Map(service.GetPurchase(id)), HttpContext.TraceIdentifier));

    [HttpPost, Authorize(Policy = Permissions.Purchases.Create)]
    public async Task<ActionResult<ApiResponse<PurchaseResponse>>> Create([FromBody] CreatePurchaseRequest request, CancellationToken cancellationToken)
    {
        var result = await service.CreatePurchaseAsync(request, currentUser.Id, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<PurchaseResponse>.Ok(HttpResponseMapper.Map(result), HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}"), Authorize(Policy = Permissions.Purchases.Create)]
    public async Task<ActionResult<ApiResponse<PurchaseResponse>>> Update([FromRoute] Guid id, [FromBody] CreatePurchaseRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<PurchaseResponse>.Ok(HttpResponseMapper.Map(await service.UpdatePurchaseAsync(id, request, currentUser.Id, cancellationToken)), HttpContext.TraceIdentifier));

    [HttpPost("{id:guid}/confirm"), Authorize(Policy = Permissions.Purchases.Confirm)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Confirm([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        await service.ConfirmPurchaseAsync(id, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/cancel"), Authorize(Policy = Permissions.Purchases.Cancel)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Cancel([FromRoute] Guid id, [FromBody] CancelRequest request, CancellationToken cancellationToken)
    {
        await service.CancelPurchaseAsync(id, request.Reason, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return NoContent();
    }
}

[ApiController, Route("api/v1/goods-receipts"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class GoodsReceiptsController(PurchaseService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet("{id:guid}"), Authorize(Policy = Permissions.Purchases.View)]
    public ActionResult<ApiResponse<GoodsReceiptResponse>> GetById([FromRoute] Guid id) =>
        Ok(ApiResponse<GoodsReceiptResponse>.Ok(HttpResponseMapper.Map(service.GetReceipt(id)), HttpContext.TraceIdentifier));

    [HttpPost, Authorize(Policy = Permissions.Purchases.Create)]
    public async Task<ActionResult<ApiResponse<GoodsReceiptResponse>>> Create([FromBody] CreateReceiptRequest request, CancellationToken cancellationToken)
    {
        var result = await service.CreateReceiptAsync(request, currentUser.Id, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<GoodsReceiptResponse>.Ok(HttpResponseMapper.Map(result), HttpContext.TraceIdentifier));
    }

    [HttpPost("{id:guid}/close"), Authorize(Policy = Permissions.Purchases.CloseReceipt)]
    public async Task<ActionResult<ApiResponse<GoodsReceiptResponse>>> Close([FromRoute] Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<GoodsReceiptResponse>.Ok(HttpResponseMapper.Map(await service.CloseReceiptAsync(id, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken)), HttpContext.TraceIdentifier));

    [HttpPost("{id:guid}/cancel"), Authorize(Policy = Permissions.Purchases.Cancel)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Cancel([FromRoute] Guid id, [FromBody] CancelRequest request, CancellationToken cancellationToken)
    {
        await service.CancelReceiptAsync(id, request.Reason, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return NoContent();
    }
}
