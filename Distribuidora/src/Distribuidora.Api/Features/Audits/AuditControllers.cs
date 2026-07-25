using System.Net.Mime;
using Distribuidora.Api.Auth;
using Distribuidora.Api.Common;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Audits;

[ApiController, Route("api/v1/logs/audit"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class AuditController(AuditService service) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Logs.AuditRead)]
    public ActionResult<ApiResponse<PagedResponse<AuditLogResponse>>> GetLogs([FromQuery] AuditLogQuery query)
    {
        var result = service.GetLogs(query.From, query.To, query.Module, query.UserId, query.Action,
            query.EntityName, query.EntityId, query.OperationId, query.TransactionId,
            query.CorrelationId, query.ReferenceFolio, Math.Max(query.Page, 1), Math.Clamp(query.PageSize, 1, 200));
        var response = new PagedResponse<AuditLogResponse>(result.Items.Select(HttpResponseMapper.MapAuditSummary).ToArray(), result.Page, result.PageSize, result.Total);
        return Ok(ApiResponse<PagedResponse<AuditLogResponse>>.Ok(response, HttpContext.TraceIdentifier));
    }

    [HttpGet("{id:guid}"), Authorize(Policy = Permissions.Logs.AuditRead)]
    public ActionResult<ApiResponse<AuditLogResponse>> GetById([FromRoute] Guid id) =>
        Ok(ApiResponse<AuditLogResponse>.Ok(HttpResponseMapper.Map(service.GetLog(id)), HttpContext.TraceIdentifier));

    [HttpGet("entities/{entityName}/{entityId:guid}"), Authorize(Policy = Permissions.Logs.AuditRead)]
    public ActionResult<ApiResponse<IReadOnlyCollection<AuditLogResponse>>> GetByEntity([FromRoute] string entityName, [FromRoute] Guid entityId) =>
        Ok(ApiResponse<IReadOnlyCollection<AuditLogResponse>>.Ok(service.GetByEntity(entityName, entityId).Select(HttpResponseMapper.MapAuditSummary).ToArray(), HttpContext.TraceIdentifier));
}

[ApiController, Route("api/v1/cancellation-reasons"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class CancellationReasonsController(AuditService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    public ActionResult<ApiResponse<IReadOnlyCollection<CancellationReasonResponse>>> GetAll() =>
        Ok(ApiResponse<IReadOnlyCollection<CancellationReasonResponse>>.Ok(service.GetCancellationReasons().Select(HttpResponseMapper.Map).ToArray(), HttpContext.TraceIdentifier));

    [HttpPost, Authorize(Policy = Permissions.Audit.ManageReasons)]
    public async Task<ActionResult<ApiResponse<CancellationReasonResponse>>> Create([FromBody] CancellationReasonRequest request, CancellationToken cancellationToken)
    {
        var result = await service.SaveCancellationReasonAsync(null, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Created($"/api/v1/cancellation-reasons/{result.Id}", ApiResponse<CancellationReasonResponse>.Ok(HttpResponseMapper.Map(result), HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}"), Authorize(Policy = Permissions.Audit.ManageReasons)]
    public async Task<ActionResult<ApiResponse<CancellationReasonResponse>>> Update([FromRoute] Guid id, [FromBody] CancellationReasonRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<CancellationReasonResponse>.Ok(HttpResponseMapper.Map(await service.SaveCancellationReasonAsync(id, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken)), HttpContext.TraceIdentifier));
}

[ApiController, Route("api/v1/operational-notes"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class OperationalNotesController(AuditService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ApiResponse<OperationalNoteResponse>>> Create([FromBody] OperationalNoteRequest request, CancellationToken cancellationToken)
    {
        var result = await service.AddNoteAsync(request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Created($"/api/v1/operational-notes/{result.Id}", ApiResponse<OperationalNoteResponse>.Ok(HttpResponseMapper.Map(result), HttpContext.TraceIdentifier));
    }
}
