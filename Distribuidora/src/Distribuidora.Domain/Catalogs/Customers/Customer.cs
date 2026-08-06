using Distribuidora.Domain.Common;
using System.Text.RegularExpressions;

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
    public CustomerFiscalProfile? FiscalProfile { get; set; }
}

public sealed class CustomerFiscalProfile : AuditableEntity
{
    public Guid CustomerId { get; set; }
    public string TaxId { get; set; } = "";
    public string LegalName { get; set; } = "";
    public string FiscalZipCode { get; set; } = "";
    public string TaxRegimeCode { get; set; } = "";
    public string? DefaultCfdiUseCode { get; set; }
    public string? InvoiceEmail { get; set; }

    public bool IsComplete() =>
        Regex.IsMatch(TaxId, @"^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$", RegexOptions.IgnoreCase) &&
        !string.IsNullOrWhiteSpace(LegalName) &&
        FiscalZipCode.Length == 5 && FiscalZipCode.All(char.IsDigit) &&
        TaxRegimeCode.Length == 3 && TaxRegimeCode.All(char.IsDigit) &&
        (string.IsNullOrWhiteSpace(DefaultCfdiUseCode) ||
         Regex.IsMatch(DefaultCfdiUseCode, "^[A-Z0-9]{3,4}$", RegexOptions.IgnoreCase));
}
