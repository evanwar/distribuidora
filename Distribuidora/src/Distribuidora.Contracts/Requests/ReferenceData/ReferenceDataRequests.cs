namespace Distribuidora.Contracts.Requests;

public sealed record NamedCatalogRequest(
    string Name,
    string? Description,
    bool Active = true);

public sealed record UnitRequest(
    string Name,
    string Abbreviation,
    bool AllowsDecimals,
    bool Active = true);
