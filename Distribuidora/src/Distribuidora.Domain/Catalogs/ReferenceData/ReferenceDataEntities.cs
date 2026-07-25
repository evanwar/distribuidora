using Distribuidora.Domain.Common;

namespace Distribuidora.Domain.Catalogs;

public abstract class NamedCatalog : AuditableEntity
{
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public bool Active { get; set; } = true;
}

public sealed class Category : NamedCatalog;

public sealed class Brand : NamedCatalog;

public sealed class Unit : NamedCatalog
{
    public string Abbreviation { get; set; } = "";
    public bool AllowsDecimals { get; set; }
}
