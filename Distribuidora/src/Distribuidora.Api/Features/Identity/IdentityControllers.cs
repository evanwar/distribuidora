using System.Net.Mime;
using Distribuidora.Api.Auth;
using Distribuidora.Api.Common;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Identity;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Identity;

[ApiController, Route("api/v1/users"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class UsersController(IdentityAccessService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Security.View)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<UserResponse>>), StatusCodes.Status200OK)]
    public ActionResult<ApiResponse<IReadOnlyCollection<UserResponse>>> GetAll() =>
        Ok(ApiResponse<IReadOnlyCollection<UserResponse>>.Ok(service.GetUsers().Select(HttpResponseMapper.Map).ToArray(), HttpContext.TraceIdentifier));

    [HttpPost, Authorize(Policy = Permissions.Security.CreateUser)]
    [ProducesResponseType(typeof(ApiResponse<UserResponse>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<UserResponse>>> Create([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        var result = await service.CreateUserAsync(request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        var response = HttpResponseMapper.Map(result);
        return Created($"/api/v1/users/{result.Id}", ApiResponse<UserResponse>.Ok(response, HttpContext.TraceIdentifier, "User created successfully."));
    }

    [HttpPut("{id:guid}"), Authorize(Policy = Permissions.Security.EditUser)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        await service.UpdateUserAsync(id, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:guid}/roles"), Authorize(Policy = Permissions.Security.ManageRoles)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> AssignRoles([FromRoute] Guid id, [FromBody] AssignIdsRequest request, CancellationToken cancellationToken)
    {
        await service.AssignRolesAsync(id, request.Ids, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return NoContent();
    }
}

[ApiController, Route("api/v1/roles"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class RolesController(IdentityAccessService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Security.View)]
    public ActionResult<ApiResponse<IReadOnlyCollection<RoleResponse>>> GetAll() =>
        Ok(ApiResponse<IReadOnlyCollection<RoleResponse>>.Ok(service.GetRoles().Select(HttpResponseMapper.Map).ToArray(), HttpContext.TraceIdentifier));

    [HttpPost, Authorize(Policy = Permissions.Security.ManageRoles)]
    [ProducesResponseType(typeof(ApiResponse<RoleResponse>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<RoleResponse>>> Create([FromBody] CreateRoleRequest request, CancellationToken cancellationToken)
    {
        var result = await service.CreateRoleAsync(request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Created($"/api/v1/roles/{result.Id}", ApiResponse<RoleResponse>.Ok(HttpResponseMapper.Map(result), HttpContext.TraceIdentifier, "Role created successfully."));
    }

    [HttpPut("{id:guid}/permissions"), Authorize(Policy = Permissions.Security.ManageRoles)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> AssignPermissions([FromRoute] Guid id, [FromBody] AssignPermissionsRequest request, CancellationToken cancellationToken)
    {
        await service.AssignPermissionsAsync(id, request.PermissionKeys, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return NoContent();
    }
}

[ApiController, Route("api/v1/permissions"), Authorize(Policy = Permissions.Security.View), Produces(MediaTypeNames.Application.Json)]
public sealed class PermissionsController(IdentityAccessService service) : ControllerBase
{
    [HttpGet]
    public ActionResult<ApiResponse<IReadOnlyCollection<PermissionResponse>>> GetAll() =>
        Ok(ApiResponse<IReadOnlyCollection<PermissionResponse>>.Ok(service.GetPermissions().Select(HttpResponseMapper.Map).ToArray(), HttpContext.TraceIdentifier));
}
