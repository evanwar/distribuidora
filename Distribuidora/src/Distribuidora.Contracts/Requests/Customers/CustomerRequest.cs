namespace Distribuidora.Contracts.Requests;

public sealed record CustomerRequest(
    string Name,
    string? TaxId,
    string? Phone,
    string? Email,
    string? Address,
    string? City,
    decimal CreditLimit,
    bool CreditBlocked,
    bool Active = true,
    string? FiscalLegalName = null,
    string? FiscalZipCode = null,
    string? TaxRegimeCode = null,
    string? DefaultCfdiUseCode = null,
    string? InvoiceEmail = null);
