using Distribuidora.Domain.Common;

namespace Distribuidora.Domain.Security;

public sealed class User : AuditableEntity
{
    public string Name { get; set; } = "";
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public bool Active { get; set; } = true;
    public DateTimeOffset? LastAccessAt { get; set; }
    public ICollection<Role> Roles { get; set; } = [];

    public void Deactivate(DateTimeOffset occurredAt)
    {
        if (!Active) return;
        Active = false;
        Raise(new EntityChangedDomainEvent("UserDeactivated", nameof(User), Id, occurredAt));
    }
}

public sealed class Role : AuditableEntity
{
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public bool Active { get; set; } = true;
    public ICollection<User> Users { get; set; } = [];
    public ICollection<Permission> Permissions { get; set; } = [];
}

public sealed class Permission
{
    public string Key { get; set; } = "";
    public string Module { get; set; } = "";
    public string Action { get; set; } = "";
    public string Description { get; set; } = "";
    public ICollection<Role> Roles { get; set; } = [];
}

public sealed class RefreshToken : Entity
{
    public uint RowVersion { get; set; }
    public string TokenHash { get; set; } = "";
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public string CreatedByIp { get; set; } = "";
}
