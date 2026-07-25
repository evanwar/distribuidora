using System.Net.Mime;
using Distribuidora.Application.Features.Authentication;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Authentication;

[ApiController]
[Route("api/v1/auth")]
[Produces(MediaTypeNames.Application.Json)]
public sealed class AuthController(AuthService service) : ControllerBase
{
    /// <summary>Authenticates a user and returns access and refresh tokens.</summary>
    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await service.LoginAsync(request, HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown", cancellationToken);
        return Ok(ApiResponse<AuthResponse>.Ok(new(result.AccessToken, result.RefreshToken, result.ExpiresAt), HttpContext.TraceIdentifier));
    }

    /// <summary>Rotates a valid refresh token.</summary>
    [AllowAnonymous]
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Refresh([FromBody] RefreshRequest request, CancellationToken cancellationToken)
    {
        var result = await service.RefreshAsync(request.RefreshToken, HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown", cancellationToken);
        return Ok(ApiResponse<AuthResponse>.Ok(new(result.AccessToken, result.RefreshToken, result.ExpiresAt), HttpContext.TraceIdentifier));
    }

    /// <summary>Revokes a refresh token.</summary>
    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType(typeof(ApiResponse<OperationResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<OperationResponse>>> Logout([FromBody] RefreshRequest request, CancellationToken cancellationToken)
    {
        await service.LogoutAsync(request.RefreshToken, cancellationToken);
        return Ok(ApiResponse<OperationResponse>.Ok(new(true), HttpContext.TraceIdentifier));
    }
}
