using System.Net.Mime;
using Distribuidora.Api.Auth;
using Distribuidora.Api.Common;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Inventory;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Inventory;

[ApiController, Route("api/v1/inventory"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class InventoryController(InventoryService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet("balances"), Authorize(Policy = Permissions.Inventory.View)]
    public ActionResult<ApiResponse<IReadOnlyCollection<StockBalanceResponse>>> GetBalances([FromQuery] InventoryBalanceQuery query) =>
        Ok(ApiResponse<IReadOnlyCollection<StockBalanceResponse>>.Ok(service.GetBalances(query.WarehouseId, query.ProductId).Select(HttpResponseMapper.Map).ToArray(), HttpContext.TraceIdentifier));

    [HttpGet("kardex"), Authorize(Policy = Permissions.Inventory.View)]
    public ActionResult<ApiResponse<IReadOnlyCollection<InventoryMovementResponse>>> GetKardex([FromQuery] KardexQuery query) =>
        Ok(ApiResponse<IReadOnlyCollection<InventoryMovementResponse>>.Ok(service.GetKardex(query.ProductId, query.WarehouseId, query.From, query.To).Select(HttpResponseMapper.Map).ToArray(), HttpContext.TraceIdentifier));

    [HttpGet("low-stock"), Authorize(Policy = Permissions.Inventory.View)]
    public ActionResult<ApiResponse<IReadOnlyCollection<LowStockResponse>>> GetLowStock() =>
        Ok(ApiResponse<IReadOnlyCollection<LowStockResponse>>.Ok(service.GetLowStock(), HttpContext.TraceIdentifier));

    [HttpPost("adjustments"), Authorize(Policy = Permissions.Inventory.Adjust)]
    [ProducesResponseType(typeof(ApiResponse<InventoryAdjustmentResponse>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<InventoryAdjustmentResponse>>> CreateAdjustment([FromBody] CreateAdjustmentRequest request, CancellationToken cancellationToken)
    {
        var result = await service.CreateAdjustmentAsync(request, currentUser.Id, cancellationToken);
        return Created($"/api/v1/inventory/adjustments/{result.Id}", ApiResponse<InventoryAdjustmentResponse>.Ok(HttpResponseMapper.Map(result), HttpContext.TraceIdentifier));
    }

    [HttpPost("adjustments/{id:guid}/confirm"), Authorize(Policy = Permissions.Inventory.Adjust)]
    public async Task<ActionResult<ApiResponse<InventoryAdjustmentResponse>>> ConfirmAdjustment([FromRoute] Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<InventoryAdjustmentResponse>.Ok(HttpResponseMapper.Map(await service.ConfirmAdjustmentAsync(id, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken)), HttpContext.TraceIdentifier));

    [HttpPost("adjustments/{id:guid}/cancel"), Authorize(Policy = Permissions.Inventory.CancelAdjustment)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> CancelAdjustment([FromRoute] Guid id, [FromBody] CancelRequest request, CancellationToken cancellationToken)
    {
        await service.CancelAdjustmentAsync(id, request.Reason, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return NoContent();
    }

    [HttpPost("transfers"), Authorize(Policy = Permissions.Inventory.Transfer)]
    public async Task<ActionResult<ApiResponse<OperationResponse>>> Transfer([FromBody] TransferRequest request, CancellationToken cancellationToken)
    {
        await service.TransferAsync(request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Ok(ApiResponse<OperationResponse>.Ok(new(true), HttpContext.TraceIdentifier));
    }
}
