namespace Distribuidora.Contracts.Requests;

public sealed record CreateUserRequest(string Name, string Username, string Email, string Password, IReadOnlyCollection<Guid>? RoleIds);
public sealed record UpdateUserRequest(string Name, string Email, bool Active);
public sealed record CreateRoleRequest(string Name, string? Description);
public sealed record AssignIdsRequest(IReadOnlyCollection<Guid> Ids);
public sealed record AssignPermissionsRequest(IReadOnlyCollection<string> PermissionKeys);
