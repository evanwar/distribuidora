using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Specifications;
using Distribuidora.Domain.Audits;
using Distribuidora.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Distribuidora.Infrastructure.Observability;

public sealed class RequestTraceContext : IRequestTraceContext
{
    public string CorrelationId { get; set; } = "";
    public string OperationId { get; set; } = "";
    public string TraceId { get; set; } = "";
    public string RequestId { get; set; } = "";
    public string? TransactionId { get; set; }
    public string? CausationId { get; set; }
}

public sealed class HttpRequestMetadataAccessor(IHttpContextAccessor accessor) : IRequestMetadataAccessor
{
    private HttpContext? Context => accessor.HttpContext;
    public string? IpAddress => Context?.Connection.RemoteIpAddress?.ToString();
    public string? UserAgent => Context?.Request.Headers.UserAgent.ToString();
    public string? Path => Context?.Request.Path.Value;
    public string? Method => Context?.Request.Method;
}

public sealed class DatatimeProvider : IDatatimeProvider
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}

public sealed class SensitiveDataSanitizer : ISensitiveDataSanitizer
{
    private const int MaximumSanitizedTextLength = 16_000;

    private static readonly string[] Denied =
    [
        "password", "passwd", "secret", "token", "authorization", "cookie",
        "refresh", "apikey", "api_key", "connectionstring", "creditcard", "cvv"
    ];

    public string? SanitizeJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return json;
        try
        {
            var node = JsonNode.Parse(json);
            Sanitize(node);
            return node?.ToJsonString();
        }
        catch (JsonException)
        {
            return SanitizeText(json);
        }
    }

    public string SanitizeText(string? text)
    {
        if (string.IsNullOrEmpty(text)) return "";
        var result = text;
        foreach (var denied in Denied)
            result = System.Text.RegularExpressions.Regex.Replace(
                result,
                $@"(?i)({System.Text.RegularExpressions.Regex.Escape(denied)}\s*[:=]\s*)[^\s,;]+",
                "$1[REDACTED]");
        return result.Length <= MaximumSanitizedTextLength
            ? result
            : result[..MaximumSanitizedTextLength];
    }

    private static void Sanitize(JsonNode? node)
    {
        if (node is JsonObject obj)
        {
            foreach (var property in obj.ToArray())
            {
                if (Denied.Any(x => property.Key.Contains(x, StringComparison.OrdinalIgnoreCase)))
                    obj[property.Key] = "[REDACTED]";
                else
                    Sanitize(property.Value);
            }
        }
        else if (node is JsonArray array)
            foreach (var child in array) Sanitize(child);
    }
}

public static class ErrorFingerprint
{
    public static string Create(Exception exception)
    {
        var origin = exception.StackTrace?.Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? exception.Source ?? "";
        var normalized = $"{exception.GetType().FullName}|{origin.Trim()}";
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(normalized))).ToLowerInvariant();
    }
}

public sealed class PostgresLogWriter(
    LoggingDbContext db,
    ISensitiveDataSanitizer sanitizer,
    IDatatimeProvider datetimeProvider) :
    IUserActivityLogWriter, ISystemErrorLogWriter, ISystemEventLogWriter
{
    public async Task WriteAsync(UserActivityLog entry, CancellationToken cancellationToken = default)
    {
        if (entry.OccurredAt == default) entry.OccurredAt = datetimeProvider.UtcNow;
        entry.RequestSummary = sanitizer.SanitizeJson(entry.RequestSummary);
        entry.ResultSummary = sanitizer.SanitizeJson(entry.ResultSummary);
        db.Add(entry);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task WriteAsync(SystemErrorLog entry, CancellationToken cancellationToken = default)
    {
        if (entry.OccurredAt == default) entry.OccurredAt = datetimeProvider.UtcNow;
        entry.Message = sanitizer.SanitizeText(entry.Message);
        entry.StackTrace = sanitizer.SanitizeText(entry.StackTrace);
        entry.InnerException = sanitizer.SanitizeJson(entry.InnerException);
        entry.ContextData = sanitizer.SanitizeJson(entry.ContextData);
        var existing = string.IsNullOrWhiteSpace(entry.Fingerprint) ? null :
            await db.Query(Specification.Create<SystemErrorLog>(
                    x => !x.IsResolved && x.Fingerprint == entry.Fingerprint))
                .FirstOrDefaultAsync(cancellationToken);
        if (existing is null)
            db.Add(entry);
        else
        {
            existing.OccurrenceCount++;
            existing.OccurredAt = entry.OccurredAt;
            existing.Message = entry.Message;
            existing.StackTrace = entry.StackTrace;
            existing.CorrelationId = entry.CorrelationId;
            existing.OperationId = entry.OperationId;
            existing.TraceId = entry.TraceId;
            existing.RequestId = entry.RequestId;
            existing.TransactionId = entry.TransactionId;
            existing.ResponseStatusCode = entry.ResponseStatusCode;
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task WriteAsync(SystemEventLog entry, CancellationToken cancellationToken = default)
    {
        if (entry.CreatedAt == default) entry.CreatedAt = datetimeProvider.UtcNow;
        entry.Payload = sanitizer.SanitizeJson(entry.Payload) ?? "{}";
        db.Add(entry);
        await db.SaveChangesAsync(cancellationToken);
    }
}
