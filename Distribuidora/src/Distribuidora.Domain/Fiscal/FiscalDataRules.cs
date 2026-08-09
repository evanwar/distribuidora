namespace Distribuidora.Domain.Fiscal;

public static class FiscalDataRules
{
    public const int TaxIdMaximumLength = 13;
    public const int LegalNameMaximumLength = 254;
    public const int PostalCodeLength = 5;
    public const int TaxRegimeCodeLength = 3;
    public const int CfdiUseCodeMaximumLength = 4;
    public const int PaymentFormCodeLength = 2;
    public const int PaymentMethodCodeLength = 3;
    public const int CurrencyCodeLength = 3;
    public const int FiscalUuidLength = 36;
    public const int CancellationReasonCodeLength = 2;

    public static bool IsNumericCode(string? value, int requiredLength) =>
        value is not null &&
        value.Length == requiredLength &&
        value.All(char.IsDigit);
}
