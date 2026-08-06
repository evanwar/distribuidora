using Distribuidora.Application.Common;
using Distribuidora.Contracts.Common;
using Distribuidora.Domain.Common;
using Distribuidora.Application.Abstractions;
using Distribuidora.Domain.Audits;
using Distribuidora.Infrastructure.Observability;
using System.Security.Claims;
using System.Text.Json;

namespace Distribuidora.Api.Middleware;

public sealed class ExceptionMiddleware(
    RequestDelegate next,
    ILogger<ExceptionMiddleware> logger,
    IHostEnvironment environment)
{
    public async Task Invoke(
        HttpContext context,
        IRequestTraceContext trace,
        ISystemErrorLogWriter errorWriter,
        IDatatimeProvider datetimeProvider)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            var status = ex switch
            {
                NotFoundException => StatusCodes.Status404NotFound,
                UnauthorizedException => StatusCodes.Status401Unauthorized,
                ConflictException => StatusCodes.Status409Conflict,
                DomainRuleException => StatusCodes.Status422UnprocessableEntity,
                ElectronicInvoicingProviderException { OutcomeUnknown: true } => StatusCodes.Status503ServiceUnavailable,
                ElectronicInvoicingProviderException => StatusCodes.Status502BadGateway,
                Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException => StatusCodes.Status409Conflict,
                ArgumentException => StatusCodes.Status400BadRequest,
                _ => StatusCodes.Status500InternalServerError
            };
            var technical = status == StatusCodes.Status500InternalServerError || ex is Microsoft.EntityFrameworkCore.DbUpdateException;
            if (technical)
            {
                logger.LogError(ex, "Request error. CorrelationId {CorrelationId} OperationId {OperationId}", trace.CorrelationId, trace.OperationId);
                try
                {
                    await errorWriter.WriteAsync(new SystemErrorLog
                    {
                        OccurredAt = datetimeProvider.UtcNow,
                        Severity = status == 500 ? "Error" : "Warning",
                        ErrorCode = ex.GetType().Name,
                        ExceptionType = ex.GetType().FullName ?? ex.GetType().Name,
                        Message = ex.Message,
                        StackTrace = ex.StackTrace,
                        InnerException = ex.InnerException is null ? null : JsonSerializer.Serialize(new { type = ex.InnerException.GetType().FullName, ex.InnerException.Message }),
                        Source = ex.Source,
                        HttpMethod = context.Request.Method,
                        RequestPath = context.Request.Path.Value,
                        ResponseStatusCode = status,
                        UserId = Guid.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : null,
                        ActorIdentifier = context.User.Identity?.Name,
                        IpAddress = context.Connection.RemoteIpAddress?.ToString(),
                        CorrelationId = trace.CorrelationId,
                        OperationId = trace.OperationId,
                        TraceId = trace.TraceId,
                        RequestId = trace.RequestId,
                        TransactionId = trace.TransactionId,
                        CausationId = trace.CausationId,
                        Environment = environment.EnvironmentName,
                        ApplicationVersion = typeof(Program).Assembly.GetName().Version?.ToString(),
                        HostName = Environment.MachineName,
                        Fingerprint = ErrorFingerprint.Create(ex)
                    }, CancellationToken.None);
                }
                catch (Exception loggingFailure)
                {
                    logger.LogCritical(loggingFailure, "System error persistence failed; original exception preserved.");
                }
            }
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";
            var message = status == 500 ? "An unexpected error occurred." : ex.Message;
            await context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail(message, [message], trace.CorrelationId));
        }
    }
}
