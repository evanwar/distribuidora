namespace Distribuidora.Contracts.Responses;

public sealed record UserResponse(Guid Id, string Name, string Username, string Email, bool Active, DateTimeOffset? LastAccessAt);
public sealed record RoleResponse(Guid Id, string Name, string? Description, bool Active, IReadOnlyCollection<string> Permissions);
public sealed record PermissionResponse(string Key, string Module, string Action, string Description);
