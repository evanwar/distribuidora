using Distribuidora.Domain.Common;

namespace Distribuidora.Domain.Catalogs;

public sealed class Customer : AuditableEntity
{
    public string Name { get; set; } = "";
    public string? TaxId { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public decimal CreditLimit { get; set; }
    public bool CreditBlocked { get; set; }
    public bool Active { get; set; } = true;
}
