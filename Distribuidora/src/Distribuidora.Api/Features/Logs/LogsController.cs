using Distribuidora.Api.Auth;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Contracts.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Logs;

[ApiController, Route("api/v1/logs"), Authorize]
public sealed class LogsController(
    LogQueryService service,
    ICurrentUser currentUser,
    IDatatimeProvider datetimeProvider) : ControllerBase
{
    [HttpGet("activity/{id:guid}"), Authorize(Policy = Permissions.Logs.ActivityRead)]
    public ActionResult<ApiResponse<ActivityLogItem>> ActivityById(Guid id) =>
        Ok(ApiResponse<ActivityLogItem>.Ok(service.ActivityById(id), HttpContext.TraceIdentifier));

    [HttpGet("activity"), Authorize(Policy = Permissions.Logs.ActivityRead)]
    public ActionResult<ApiResponse<PagedResponse<ActivityLogItem>>> Activity(
        [FromQuery] DateTimeOffset? dateFrom, [FromQuery] DateTimeOffset? dateTo,
        [FromQuery] Guid? userId, [FromQuery] string? module, [FromQuery] string? action,
        [FromQuery] bool? succeeded, [FromQuery] int? statusCode, [FromQuery] string? correlationId,
        [FromQuery] string? operationId, [FromQuery] string? referenceFolio,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50) =>
        Ok(ApiResponse<PagedResponse<ActivityLogItem>>.Ok(service.Activity(
            From(dateFrom), To(dateTo), userId, module, action, succeeded, statusCode,
            correlationId, operationId, referenceFolio, Page(page), Size(pageSize)), HttpContext.TraceIdentifier));

    [HttpGet("errors"), Authorize(Policy = Permissions.Logs.ErrorsRead)]
    public ActionResult<ApiResponse<PagedResponse<ErrorLogItem>>> Errors(
        [FromQuery] DateTimeOffset? dateFrom, [FromQuery] DateTimeOffset? dateTo,
        [FromQuery] string? severity, [FromQuery] bool? isResolved, [FromQuery] string? fingerprint,
        [FromQuery] string? correlationId, [FromQuery] string? operationId, [FromQuery] string? eventId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50) =>
        Ok(ApiResponse<PagedResponse<ErrorLogItem>>.Ok(service.Errors(
            From(dateFrom), To(dateTo), severity, isResolved, fingerprint, correlationId,
            operationId, eventId, Page(page), Size(pageSize)), HttpContext.TraceIdentifier));

    [HttpGet("errors/{id:guid}"), Authorize(Policy = Permissions.Logs.ErrorsRead)]
    public ActionResult<ApiResponse<ErrorLogItem>> ErrorById(Guid id) =>
        Ok(ApiResponse<ErrorLogItem>.Ok(service.ErrorById(id), HttpContext.TraceIdentifier));

    [HttpPost("errors/{id:guid}/resolve"), Authorize(Policy = Permissions.Logs.ErrorsResolve)]
    public async Task<IActionResult> Resolve(Guid id, [FromBody] ErrorResolutionRequest request, CancellationToken ct)
    {
        await service.ResolveErrorAsync(id, currentUser.Id, request.Notes, true, ct);
        return NoContent();
    }

    [HttpPost("errors/{id:guid}/reopen"), Authorize(Policy = Permissions.Logs.ErrorsResolve)]
    public async Task<IActionResult> Reopen(Guid id, CancellationToken ct)
    {
        await service.ResolveErrorAsync(id, currentUser.Id, null, false, ct);
        return NoContent();
    }

    [HttpGet("events"), Authorize(Policy = Permissions.Logs.EventsRead)]
    public ActionResult<ApiResponse<PagedResponse<EventLogItem>>> Events(
        [FromQuery] DateTimeOffset? dateFrom, [FromQuery] DateTimeOffset? dateTo,
        [FromQuery] string? eventName, [FromQuery] string? status, [FromQuery] string? operationId,
        [FromQuery] string? correlationId, [FromQuery] string? causationId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50) =>
        Ok(ApiResponse<PagedResponse<EventLogItem>>.Ok(service.Events(
            From(dateFrom), To(dateTo), eventName, status, operationId, correlationId,
            causationId, Page(page), Size(pageSize)), HttpContext.TraceIdentifier));

    [HttpGet("events/{eventId}"), Authorize(Policy = Permissions.Logs.EventsRead)]
    public ActionResult<ApiResponse<EventLogItem>> EventById(string eventId) =>
        Ok(ApiResponse<EventLogItem>.Ok(service.EventById(eventId), HttpContext.TraceIdentifier));

    private DateTimeOffset From(DateTimeOffset? value) => value ?? datetimeProvider.UtcNow.AddDays(-7);
    private DateTimeOffset To(DateTimeOffset? value) => value ?? datetimeProvider.UtcNow;
    private static int Page(int value) => Math.Max(value, 1);
    private static int Size(int value) => Math.Clamp(value, 1, 200);
}

public sealed record ErrorResolutionRequest(string? Notes);

[ApiController, Route("api/v1/trace"), Authorize(Policy = Permissions.Logs.TraceRead)]
public sealed class TraceController(LogQueryService service) : ControllerBase
{
    [HttpGet("operations/{operationId}")]
    public ActionResult<ApiResponse<IReadOnlyCollection<TraceItem>>> Operation(string operationId) =>
        Ok(ApiResponse<IReadOnlyCollection<TraceItem>>.Ok(service.ByOperation(operationId), HttpContext.TraceIdentifier));

    [HttpGet("correlations/{correlationId}")]
    public ActionResult<ApiResponse<IReadOnlyCollection<TraceItem>>> Correlation(string correlationId) =>
        Ok(ApiResponse<IReadOnlyCollection<TraceItem>>.Ok(service.ByCorrelation(correlationId), HttpContext.TraceIdentifier));

    [HttpGet("documents/{folio}")]
    public ActionResult<ApiResponse<IReadOnlyCollection<TraceItem>>> Document(string folio) =>
        Ok(ApiResponse<IReadOnlyCollection<TraceItem>>.Ok(service.ByDocument(folio), HttpContext.TraceIdentifier));

    [HttpGet("events/{eventId}")]
    public ActionResult<ApiResponse<IReadOnlyCollection<TraceItem>>> Event(string eventId) =>
        Ok(ApiResponse<IReadOnlyCollection<TraceItem>>.Ok(service.ByEvent(eventId), HttpContext.TraceIdentifier));
}
