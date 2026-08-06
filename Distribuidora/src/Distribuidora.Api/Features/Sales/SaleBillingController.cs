using System.Net.Mime;
using Distribuidora.Api.Auth;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Sales;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Sales;

[ApiController, Route("api/v1/counter-sales/{saleId:guid}"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class SaleBillingController(SaleBillingService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet("billing-eligibility"), Authorize(Policy = Permissions.Sales.ViewBillingEligibility)]
    public ActionResult<ApiResponse<SaleBillingEligibilityResponse>> GetEligibility([FromRoute] Guid saleId) =>
        Ok(ApiResponse<SaleBillingEligibilityResponse>.Ok(service.GetEligibility(saleId), HttpContext.TraceIdentifier));

    [HttpGet("fiscal-status"), Authorize(Policy = Permissions.Sales.ViewBillingEligibility)]
    public ActionResult<ApiResponse<SaleFiscalStatusResponse>> GetFiscalStatus([FromRoute] Guid saleId) =>
        Ok(ApiResponse<SaleFiscalStatusResponse>.Ok(service.GetStatus(saleId), HttpContext.TraceIdentifier));

    [HttpPut("billing-recipient"), Authorize(Policy = Permissions.Sales.AssignBillingRecipient)]
    public async Task<ActionResult<ApiResponse<SaleBillingRecipientResponse>>> AssignRecipient(
        [FromRoute] Guid saleId,
        [FromBody] AssignSaleBillingRecipientRequest request,
        CancellationToken ct)
    {
        var recipient = await service.AssignAsync(saleId, request, currentUser.Id, HttpContext.TraceIdentifier, ct);
        return Ok(ApiResponse<SaleBillingRecipientResponse>.Ok(
            new(recipient.Id, recipient.SaleId, recipient.CustomerId, recipient.Status.ToString(), recipient.Reason,
                recipient.AssignedAt, recipient.AssignedBy, recipient.RowVersion),
            HttpContext.TraceIdentifier));
    }

    [HttpPut("fiscal-coverage"), Authorize(Policy = Permissions.Sales.ManageGlobalInvoiceReplacement)]
    public async Task<ActionResult<ApiResponse<SaleFiscalStatusResponse>>> ReconcileFiscalCoverage(
        [FromRoute] Guid saleId,
        [FromBody] ReconcileSaleFiscalCoverageRequest request,
        CancellationToken ct)
    {
        await service.ReconcileAsync(saleId, request, currentUser.Id, HttpContext.TraceIdentifier, ct);
        return Ok(ApiResponse<SaleFiscalStatusResponse>.Ok(service.GetStatus(saleId), HttpContext.TraceIdentifier));
    }
}
