using Microsoft.AspNetCore.Authorization;
using Distribuidora.Application.Security;

namespace Distribuidora.Api.Auth;

public sealed record PermissionRequirement(string Permission) : IAuthorizationRequirement;

public sealed class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User.HasClaim(SecurityClaimTypes.Permission, requirement.Permission)) context.Succeed(requirement);
        return Task.CompletedTask;
    }
}
