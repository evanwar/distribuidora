using Distribuidora.Infrastructure.Observability;
using Distribuidora.Application.Common;

namespace Distribuidora.UnitTests;

public sealed class ObservabilityTests
{
    [Fact]
    public void Sanitizer_redacts_denied_json_properties_recursively()
    {
        var sanitizer = new SensitiveDataSanitizer();

        var result = sanitizer.SanitizeJson("""{"username":"eva","password":"secret","nested":{"accessToken":"abc"}}""");

        Assert.Contains("\"username\":\"eva\"", result);
        Assert.DoesNotContain("secret", result);
        Assert.DoesNotContain("abc", result);
        Assert.Equal(2, result!.Split("[REDACTED]").Length - 1);
    }

    [Fact]
    public void Error_fingerprint_is_stable_for_same_type_and_origin()
    {
        static Exception Capture(string message)
        {
            try { throw new InvalidOperationException(message); }
            catch (Exception ex) { return ex; }
        }

        var first = ErrorFingerprint.Create(Capture("value 123"));
        var second = ErrorFingerprint.Create(Capture("value 999"));

        Assert.Equal(first, second);
        Assert.Equal(64, first.Length);
    }

    [Fact]
    public void Sanitizer_redacts_key_value_text()
    {
        var sanitizer = new SensitiveDataSanitizer();
        var result = sanitizer.SanitizeText("authorization=Bearer-abc password:hello");
        Assert.DoesNotContain("Bearer-abc", result);
        Assert.DoesNotContain("hello", result);
    }

    [Fact]
    public void Audit_actions_use_stable_semantic_names() =>
        Assert.Equal("COUNTER_SALE_CONFIRMED", AuditActionName.For("CounterSale", "Confirm"));
}
