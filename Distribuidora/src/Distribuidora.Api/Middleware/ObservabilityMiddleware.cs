using System.Diagnostics;
using System.Security.Claims;
using Distribuidora.Application.Abstractions;
using Distribuidora.Domain.Audits;
using Microsoft.AspNetCore.Routing;

namespace Distribuidora.Api.Middleware;

public sealed class CorrelationAndOperationMiddleware(RequestDelegate next)
{
    private const int MaximumClientIdentifierLength = 100;

    public async Task Invoke(
        HttpContext context,
        IRequestTraceContext trace,
        IDatatimeProvider datetimeProvider)
    {
        trace.CorrelationId = Valid(context.Request.Headers["X-Correlation-ID"].FirstOrDefault())
            ?? Guid.NewGuid().ToString("N");
        trace.OperationId = Valid(context.Request.Headers["X-Operation-ID"].FirstOrDefault())
            ?? CreateOperationId(datetimeProvider.UtcNow);
        trace.TraceId = Activity.Current?.TraceId.ToString() ?? context.TraceIdentifier;
        trace.RequestId = context.TraceIdentifier;
        context.TraceIdentifier = trace.CorrelationId;
        context.Response.Headers["X-Correlation-ID"] = trace.CorrelationId;
        context.Response.Headers["X-Operation-ID"] = trace.OperationId;
        await next(context);
    }

    private static string? Valid(string? value) =>
        !string.IsNullOrWhiteSpace(value) && value.Length <= MaximumClientIdentifierLength &&
        value.All(c => char.IsLetterOrDigit(c) || c is '-' or '_' or '.') ? value : null;

    private static string CreateOperationId(DateTimeOffset utcNow) =>
        $"{utcNow.ToUnixTimeMilliseconds():x12}{Guid.NewGuid():N}"[..26].ToUpperInvariant();
}

public sealed class UserActivityLoggingMiddleware(RequestDelegate next, ILogger<UserActivityLoggingMiddleware> logger)
{
    private const int ModuleRouteSegmentIndex = 2;

    public async Task Invoke(
        HttpContext context,
        IRequestTraceContext trace,
        IUserActivityLogWriter writer,
        IDatatimeProvider datetimeProvider)
    {
        var started = datetimeProvider.UtcNow;
        var stopwatch = Stopwatch.StartNew();
        Exception? failure = null;
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            failure = ex;
            throw;
        }
        finally
        {
            stopwatch.Stop();
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                var endpoint = context.GetEndpoint();
                var route = endpoint?.Metadata.GetMetadata<RouteEndpoint>()?.RoutePattern.RawText;
                var segments = context.Request.Path.Value?.Split('/', StringSplitOptions.RemoveEmptyEntries);
                var status = failure is null ? context.Response.StatusCode : StatusCodes.Status500InternalServerError;
                var entry = new UserActivityLog
                {
                    OccurredAt = started,
                    CompletedAt = datetimeProvider.UtcNow,
                    UserId = UserId(context.User),
                    ActorIdentifier = context.User.Identity?.Name ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier),
                    SessionId = context.User.FindFirstValue("sid"),
                    Module = segments?.Length > ModuleRouteSegmentIndex
                        ? segments[ModuleRouteSegmentIndex]
                        : "api",
                    Action = endpoint?.DisplayName ?? $"{context.Request.Method} {route ?? context.Request.Path.Value}",
                    HttpMethod = context.Request.Method,
                    RouteTemplate = route,
                    RequestPath = context.Request.Path.Value,
                    ResponseStatusCode = status,
                    DurationMs = stopwatch.ElapsedMilliseconds,
                    IpAddress = context.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = context.Request.Headers.UserAgent.ToString(),
                    CorrelationId = trace.CorrelationId,
                    OperationId = trace.OperationId,
                    TraceId = trace.TraceId,
                    RequestId = trace.RequestId,
                    TransactionId = trace.TransactionId,
                    CausationId = trace.CausationId,
                    Succeeded = failure is null && status < StatusCodes.Status400BadRequest,
                    FailureCode = failure?.GetType().Name ??
                                  (status >= StatusCodes.Status400BadRequest ? $"HTTP_{status}" : null)
                };
                try
                {
                    await writer.WriteAsync(entry, CancellationToken.None);
                }
                catch (Exception logError)
                {
                    logger.LogError(logError, "User activity persistence failed for {CorrelationId}", trace.CorrelationId);
                }
            }
        }
    }

    private static Guid? UserId(ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
}
