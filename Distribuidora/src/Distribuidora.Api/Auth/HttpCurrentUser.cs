using System.Security.Claims;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;

namespace Distribuidora.Api.Auth;

public sealed class HttpCurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public Guid Id
    {
        get
        {
            var principal = accessor.HttpContext?.User;
            var value = principal?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? principal?.FindFirstValue("sub");
            return Guid.TryParse(value, out var id)
                ? id
                : throw new UnauthorizedException("Authenticated user identifier is missing.");
        }
    }
}
