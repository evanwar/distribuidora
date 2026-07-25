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
    bool Active = true);
