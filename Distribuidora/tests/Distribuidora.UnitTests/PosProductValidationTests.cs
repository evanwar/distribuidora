using Distribuidora.Application.Features.Products.PosProducts;
using Distribuidora.Contracts.Requests;

namespace Distribuidora.UnitTests;

public sealed class PosProductValidationTests
{
    [Fact]
    public void Rejects_unbounded_search_and_inverted_price_ranges()
    {
        var validator = new PosProductSearchValidator();
        Assert.False(validator.Validate(new PosProductSearchRequest()).IsValid);
        Assert.False(validator.Validate(new PosProductSearchRequest { WarehouseId = Guid.NewGuid(), PageSize = 1000 }).IsValid);
        Assert.False(validator.Validate(new PosProductSearchRequest { WarehouseId = Guid.NewGuid(), MinimumPrice = 20, MaximumPrice = 10 }).IsValid);
        Assert.True(validator.Validate(new PosProductSearchRequest { WarehouseId = Guid.NewGuid(), Search = "coca 600" }).IsValid);
    }
    [Fact]
    public void Exact_lookup_requires_a_complete_nonempty_value()
    {
        Assert.False(new PosProductSearchValidator().Validate(new PosProductSearchRequest { WarehouseId = Guid.NewGuid(), ExactBarcode = true }).IsValid);
        Assert.False(new PosFacetValidator().Validate(new PosFacetRequest { Kind = "unknown" }).IsValid);
    }
}
