namespace Distribuidora.Contracts.Common;

public sealed record ApiResponse<T>(
    bool Success,
    T? Data,
    string Message,
    IReadOnlyCollection<string> Errors,
    string CorrelationId)
{
    public static ApiResponse<T> Ok(T data, string correlationId, string message = "Operation completed successfully") =>
        new(true, data, message, [], correlationId);

    public static ApiResponse<T> Fail(string message, IEnumerable<string> errors, string correlationId) =>
        new(false, default, message, errors.ToArray(), correlationId);
}

public sealed record PagedResponse<T>(
    IReadOnlyCollection<T> Items,
    int Page,
    int PageSize,
    int Total);
