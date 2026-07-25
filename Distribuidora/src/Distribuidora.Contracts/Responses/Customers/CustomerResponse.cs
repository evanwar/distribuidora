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
    bool Active);
