using Distribuidora.Domain.Common;

namespace Distribuidora.Domain.Catalogs;

public enum WarehouseType { Central, Counter }

public sealed class Warehouse : AuditableEntity
{
    public string Name { get; set; } = "";
    public WarehouseType Type { get; set; }
    public bool Active { get; set; } = true;
}
