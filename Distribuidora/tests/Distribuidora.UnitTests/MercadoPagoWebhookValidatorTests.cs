using System.Security.Cryptography;
using System.Text;
using Distribuidora.Infrastructure.Payments;
using Microsoft.Extensions.Options;

namespace Distribuidora.UnitTests;

public sealed class MercadoPagoWebhookValidatorTests
{
    [Fact]
    public void AcceptsValidSignatureAndNormalizesUppercaseOrderId()
    {
        const string secret = "webhook-secret";
        const string dataId = "ORD01ABC";
        const string requestId = "request-123";
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
        var manifest = $"id:{dataId.ToLowerInvariant()};request-id:{requestId};ts:{timestamp};";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(manifest))).ToLowerInvariant();
        var validator = new MercadoPagoWebhookValidator(Options.Create(new MercadoPagoPointOptions
        {
            WebhookSecret = secret,
            ApplicationId = "app-1"
        }));

        Assert.True(validator.IsValid($"ts={timestamp},v1={hash}", requestId, dataId));
        Assert.True(validator.IsExpectedApplication("app-1"));
        Assert.False(validator.IsExpectedApplication("another-app"));
    }

    [Fact]
    public void RejectsModifiedSignature()
    {
        var validator = new MercadoPagoWebhookValidator(Options.Create(new MercadoPagoPointOptions
        {
            WebhookSecret = "webhook-secret"
        }));

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        Assert.False(validator.IsValid($"ts={timestamp},v1={new string('0', 64)}", "request-123", "ORD01ABC"));
    }

    [Fact]
    public void RejectsExpiredSignedWebhook()
    {
        const string secret = "webhook-secret";
        const string dataId = "ORD01ABC";
        const string requestId = "request-123";
        var timestamp = DateTimeOffset.UtcNow.AddMinutes(-10).ToUnixTimeMilliseconds().ToString();
        var manifest = $"id:{dataId.ToLowerInvariant()};request-id:{requestId};ts:{timestamp};";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(manifest))).ToLowerInvariant();
        var validator = new MercadoPagoWebhookValidator(Options.Create(new MercadoPagoPointOptions
        {
            WebhookSecret = secret,
            WebhookToleranceSeconds = 300
        }));

        Assert.False(validator.IsValid($"ts={timestamp},v1={hash}", requestId, dataId));
    }
}
