using System.Net.Mime;
using Distribuidora.Api.Auth;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Reports;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Reports;

[ApiController, Route("api/v1/reports"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class ReportsController(
    ReportService service,
    IDatatimeProvider datetimeProvider) : ControllerBase
{
    [HttpGet("sales-summary"), Authorize(Policy = Permissions.Reports.View)]
    public ActionResult<ApiResponse<SalesSummaryResponse>> SalesSummary([FromQuery] DateRangeQuery query) =>
        Ok(ApiResponse<SalesSummaryResponse>.Ok(service.SalesSummary(query.From, query.To), HttpContext.TraceIdentifier));

    [HttpGet("sales-by-product"), Authorize(Policy = Permissions.Reports.View)]
    public ActionResult<ApiResponse<IReadOnlyCollection<SalesByProductResponse>>> SalesByProduct([FromQuery] DateRangeQuery query) =>
        Ok(ApiResponse<IReadOnlyCollection<SalesByProductResponse>>.Ok(service.SalesByProduct(query.From, query.To), HttpContext.TraceIdentifier));

    [HttpGet("gross-profit"), Authorize(Policy = Permissions.Reports.Financial)]
    public ActionResult<ApiResponse<GrossProfitResponse>> GrossProfit([FromQuery] DateRangeQuery query) =>
        Ok(ApiResponse<GrossProfitResponse>.Ok(service.GrossProfit(query.From, query.To), HttpContext.TraceIdentifier));

    [HttpGet("inventory-summary"), Authorize(Policy = Permissions.Reports.Inventory)]
    public ActionResult<ApiResponse<IReadOnlyCollection<InventorySummaryResponse>>> InventorySummary() =>
        Ok(ApiResponse<IReadOnlyCollection<InventorySummaryResponse>>.Ok(service.InventorySummary(), HttpContext.TraceIdentifier));

    [HttpGet("low-stock"), Authorize(Policy = Permissions.Reports.Inventory)]
    public ActionResult<ApiResponse<IReadOnlyCollection<LowStockResponse>>> LowStock() =>
        Ok(ApiResponse<IReadOnlyCollection<LowStockResponse>>.Ok(service.LowStock(), HttpContext.TraceIdentifier));

    [HttpGet("purchases-summary"), Authorize(Policy = Permissions.Reports.View)]
    public ActionResult<ApiResponse<PurchasesSummaryResponse>> PurchasesSummary([FromQuery] DateRangeQuery query) =>
        Ok(ApiResponse<PurchasesSummaryResponse>.Ok(service.PurchasesSummary(query.From, query.To), HttpContext.TraceIdentifier));

    [HttpGet("accounts-receivable-aging"), Authorize(Policy = Permissions.Reports.Financial)]
    public ActionResult<ApiResponse<ReceivablesAgingResponse>> ReceivablesAging([FromQuery] DateTimeOffset? asOf) =>
        Ok(ApiResponse<ReceivablesAgingResponse>.Ok(service.ReceivablesAging(asOf ?? datetimeProvider.UtcNow), HttpContext.TraceIdentifier));
}

[ApiController, Route("api/v1/dashboard"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class DashboardController(
    ReportService service,
    IDatatimeProvider datetimeProvider) : ControllerBase
{
    [HttpGet("summary"), Authorize(Policy = Permissions.Reports.View)]
    public ActionResult<ApiResponse<DashboardResponse>> Summary() =>
        Ok(ApiResponse<DashboardResponse>.Ok(service.Dashboard(datetimeProvider.UtcNow), HttpContext.TraceIdentifier));
}
