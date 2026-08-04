using System.Net.Mime;
using Distribuidora.Api.Auth;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Sales;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Distribuidora.Domain.Sales;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Sales;

[ApiController, Route("api/v1/sales/{saleId:guid}/electronic-invoice"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class ElectronicInvoicesController(ElectronicInvoiceService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Sales.View)]
    public ActionResult<ApiResponse<ElectronicInvoiceResponse>> Get(Guid saleId) => Ok(ApiResponse<ElectronicInvoiceResponse>.Ok(Map(service.Get(saleId)), HttpContext.TraceIdentifier));

    [HttpPost, Authorize(Policy = Permissions.Sales.Invoice)]
    public async Task<ActionResult<ApiResponse<ElectronicInvoiceResponse>>> Issue(Guid saleId, IssueElectronicInvoiceRequest request, CancellationToken ct)
    {
        var invoice = await service.IssueAsync(saleId, request, currentUser.Id, HttpContext.TraceIdentifier, ct);
        return Created($"/api/v1/sales/{saleId}/electronic-invoice", ApiResponse<ElectronicInvoiceResponse>.Ok(Map(invoice), HttpContext.TraceIdentifier));
    }

    [HttpGet("files/{format}"), Authorize(Policy = Permissions.Sales.View)]
    public async Task<IActionResult> Download(Guid saleId, string format, CancellationToken ct)
    {
        var file = await service.DownloadAsync(saleId, format, ct);
        return File(file.Content, file.ContentType, file.FileName);
    }

    [HttpPost("cancel"), Authorize(Policy = Permissions.Sales.CancelInvoice)]
    public async Task<ActionResult<ApiResponse<ElectronicInvoiceResponse>>> Cancel(Guid saleId, CancelElectronicInvoiceRequest request, CancellationToken ct) =>
        Ok(ApiResponse<ElectronicInvoiceResponse>.Ok(Map(await service.CancelAsync(saleId, request, currentUser.Id, HttpContext.TraceIdentifier, ct)), HttpContext.TraceIdentifier));

    private static ElectronicInvoiceResponse Map(ElectronicInvoice x) => new(x.Id, x.SaleId, x.Provider, x.Status.ToString(), x.ProviderInvoiceId,
        x.FiscalUuid, x.IssuedAt, x.CancelledAt, x.CancellationReasonCode, x.ErrorCode, x.ErrorMessage);
}
