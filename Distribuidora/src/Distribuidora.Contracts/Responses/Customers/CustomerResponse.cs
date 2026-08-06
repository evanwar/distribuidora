namespace Distribuidora.Contracts.Responses;

public sealed record CustomerResponse(
    Guid Id,
    string Name,
    string? TaxId,
    string? Phone,
    string? Email,
    string? Address,
    string? City,
    decimal CreditLimit,
    bool CreditBlocked,
    bool Active,
    string? FiscalLegalName,
    string? FiscalZipCode,
    string? TaxRegimeCode,
    string? DefaultCfdiUseCode,
    string? InvoiceEmail,
    bool HasCompleteFiscalProfile);
