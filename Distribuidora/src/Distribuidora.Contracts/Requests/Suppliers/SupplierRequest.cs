namespace Distribuidora.Contracts.Requests;

public sealed record SupplierRequest(
    string Name,
    string? ContactName,
    string? Phone,
    string? Email,
    string? Address,
    bool Active = true);
