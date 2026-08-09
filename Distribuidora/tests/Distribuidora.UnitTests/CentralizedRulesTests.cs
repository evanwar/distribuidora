using Distribuidora.Application.Security;
using Distribuidora.Domain.Fiscal;

namespace Distribuidora.UnitTests;

public sealed class CentralizedRulesTests
{
    [Theory]
    [InlineData("01000", true)]
    [InlineData("1234", false)]
    [InlineData("123456", false)]
    [InlineData("12A45", false)]
    [InlineData(null, false)]
    public void Fiscal_postal_code_uses_the_centralized_rule(string? value, bool expected)
    {
        var result = FiscalDataRules.IsNumericCode(value, FiscalDataRules.PostalCodeLength);

        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("601", true)]
    [InlineData("60", false)]
    [InlineData("0601", false)]
    [InlineData("A01", false)]
    [InlineData(null, false)]
    public void Tax_regime_code_uses_the_centralized_rule(string? value, bool expected)
    {
        var result = FiscalDataRules.IsNumericCode(value, FiscalDataRules.TaxRegimeCodeLength);

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Permission_catalog_contains_unique_non_empty_keys()
    {
        Assert.DoesNotContain(Permissions.All, string.IsNullOrWhiteSpace);
        Assert.Equal(Permissions.All.Length, Permissions.All.Distinct(StringComparer.Ordinal).Count());
        Assert.Contains(Permissions.Catalogs.Deactivate, Permissions.All);
        Assert.Contains(Permissions.Audit.Export, Permissions.All);
    }
}
