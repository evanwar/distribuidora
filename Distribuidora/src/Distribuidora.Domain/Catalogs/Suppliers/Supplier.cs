using Distribuidora.Domain.Common;

namespace Distribuidora.Domain.Catalogs;

public sealed class Supplier : AuditableEntity
{
    public string Name { get; set; } = "";
    public string? ContactName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public bool Active { get; set; } = true;
}
