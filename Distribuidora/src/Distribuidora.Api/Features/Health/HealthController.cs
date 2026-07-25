using System.Net.Mime;
using Distribuidora.Application.Abstractions;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Health;

[ApiController]
[Route("api/v1/health")]
[AllowAnonymous]
[Produces(MediaTypeNames.Application.Json)]
public sealed class HealthController(IDatatimeProvider datetimeProvider) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<HealthResponse>), StatusCodes.Status200OK)]
    public ActionResult<ApiResponse<HealthResponse>> Get() =>
        Ok(ApiResponse<HealthResponse>.Ok(new("healthy", datetimeProvider.UtcNow), HttpContext.TraceIdentifier));
}
