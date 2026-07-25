namespace Distribuidora.Contracts.Responses;

public sealed record NamedCatalogResponse(
    Guid Id,
    string Name,
    string? Description,
    bool Active);

public sealed record UnitResponse(
    Guid Id,
    string Name,
    string Abbreviation,
    bool AllowsDecimals,
    bool Active);
