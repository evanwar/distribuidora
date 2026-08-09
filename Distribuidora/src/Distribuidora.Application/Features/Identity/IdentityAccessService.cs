using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Specifications;
using Distribuidora.Application.Security;
using Distribuidora.Contracts.Requests;
using Distribuidora.Domain.Security;

namespace Distribuidora.Application.Features.Identity;

public sealed class IdentityAccessService(
    IAppDbContext db,
    IPasswordService passwords,
    IDatatimeProvider datetimeProvider,
    AuditEntryService audit)
{
    private const int MinimumActiveAdministratorCount = 1;

    public IReadOnlyCollection<User> GetUsers() =>
        db.Query(Specification.All<User>()).OrderBy(x => x.Username).ToArray();

    public async Task<User> CreateUserAsync(
        CreateUserRequest request,
        Guid actorId,
        string correlationId,
        CancellationToken cancellationToken)
    {
        if (db.Query(Specification.Create<User>(
                x => x.Username == request.Username || x.Email == request.Email)).Any())
            throw new ConflictException("Username or email already exists.");
        if (request.Password.Length < AuthenticationDefaults.MinimumPasswordLength)
            throw new ArgumentException($"Password must contain at least {AuthenticationDefaults.MinimumPasswordLength} characters.");

        var user = new User
        {
            Name = request.Name.Trim(),
            Username = request.Username.Trim().ToLowerInvariant(),
            Email = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = passwords.Hash(request.Password),
            CreatedBy = actorId
        };
        if (request.RoleIds is not null)
            foreach (var role in db.Query(Specification.Create<Role>(x => request.RoleIds.Contains(x.Id))))
                user.Roles.Add(role);

        db.Add(user);
        audit.Add("Create", "security", nameof(User), user.Id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task UpdateUserAsync(
        Guid id,
        UpdateUserRequest request,
        Guid actorId,
        string correlationId,
        CancellationToken cancellationToken)
    {
        var user = db.Query(Specification.Create<User>(x => x.Id == id)).SingleOrDefault()
                   ?? throw new NotFoundException("User not found.");
        if (!request.Active &&
            user.Roles.Any(x => x.Name == SecurityRoleNames.Administrator) &&
            db.Query(Specification.Create<User>(
                x => x.Active && x.Roles.Any(role => role.Name == SecurityRoleNames.Administrator))).Count() ==
            MinimumActiveAdministratorCount)
            throw new ConflictException("The last active administrator cannot be deactivated.");

        user.Name = request.Name.Trim();
        user.Email = request.Email.Trim().ToLowerInvariant();
        user.Active = request.Active;
        user.UpdatedAt = datetimeProvider.UtcNow;
        user.UpdatedBy = actorId;
        audit.Add("Update", "security", nameof(User), user.Id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task AssignRolesAsync(
        Guid id,
        IReadOnlyCollection<Guid> roleIds,
        Guid actorId,
        string correlationId,
        CancellationToken cancellationToken)
    {
        var user = db.Query(Specification.Create<User>(x => x.Id == id)).SingleOrDefault()
                   ?? throw new NotFoundException("User not found.");
        user.Roles.Clear();
        foreach (var role in db.Query(Specification.Create<Role>(x => roleIds.Contains(x.Id))))
            user.Roles.Add(role);
        audit.Add("AssignRoles", "security", nameof(User), id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
    }

    public IReadOnlyCollection<Role> GetRoles() =>
        db.Query(Specification.All<Role>()).OrderBy(x => x.Name).ToArray();

    public IReadOnlyCollection<Permission> GetPermissions() =>
        db.Query(Specification.All<Permission>()).OrderBy(x => x.Key).ToArray();

    public async Task<Role> CreateRoleAsync(
        CreateRoleRequest request,
        Guid actorId,
        string correlationId,
        CancellationToken cancellationToken)
    {
        if (db.Query(Specification.Create<Role>(x => x.Name == request.Name)).Any())
            throw new ConflictException("Role name already exists.");
        var role = new Role
        {
            Name = request.Name.Trim(),
            Description = request.Description,
            CreatedBy = actorId
        };
        db.Add(role);
        audit.Add("Create", "security", nameof(Role), role.Id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
        return role;
    }

    public async Task AssignPermissionsAsync(
        Guid id,
        IReadOnlyCollection<string> keys,
        Guid actorId,
        string correlationId,
        CancellationToken cancellationToken)
    {
        var role = db.Query(Specification.Create<Role>(x => x.Id == id)).SingleOrDefault()
                   ?? throw new NotFoundException("Role not found.");
        var permissions = db.Query(Specification.Create<Permission>(x => keys.Contains(x.Key))).ToArray();
        if (permissions.Length != keys.Distinct().Count())
            throw new ArgumentException("One or more permission keys do not exist.");

        role.Permissions.Clear();
        foreach (var permission in permissions)
            role.Permissions.Add(permission);
        audit.Add("AssignPermissions", "security", nameof(Role), id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
    }
}
