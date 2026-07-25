using Distribuidora.Domain.Audits;
using Distribuidora.Application.Specifications;

namespace Distribuidora.Application.Abstractions;

public interface IRequestTraceContext
{
    string CorrelationId { get; set; }
    string OperationId { get; set; }
    string TraceId { get; set; }
    string RequestId { get; set; }
    string? TransactionId { get; set; }
    string? CausationId { get; set; }
}

public interface IRequestMetadataAccessor
{
    string? IpAddress { get; }
    string? UserAgent { get; }
    string? Path { get; }
    string? Method { get; }
}

public interface IUserActivityLogWriter
{
    Task WriteAsync(UserActivityLog entry, CancellationToken cancellationToken = default);
}

public interface ISystemErrorLogWriter
{
    Task WriteAsync(SystemErrorLog entry, CancellationToken cancellationToken = default);
}

public interface ISystemEventLogWriter
{
    Task WriteAsync(SystemEventLog entry, CancellationToken cancellationToken = default);
}

public interface ISensitiveDataSanitizer
{
    string? SanitizeJson(string? json);
    string SanitizeText(string? text);
}

public interface ILogQueryStore
{
    IQueryable<TEntity> Query<TEntity>(Specification<TEntity> specification)
        where TEntity : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
