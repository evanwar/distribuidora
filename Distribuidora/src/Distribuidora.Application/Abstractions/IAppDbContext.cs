using Distribuidora.Application.Specifications;
using Distribuidora.Domain.Security;

namespace Distribuidora.Application.Abstractions;

public interface IAppDbContext
{
    IQueryable<TEntity> Query<TEntity>(Specification<TEntity> specification)
        where TEntity : class;

    void Add<T>(T entity) where T : class;
    void Remove<T>(T entity) where T : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<T> ExecuteAtomicAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken = default);
}

public interface IPasswordService
{
    string Hash(string password);
    bool Verify(string hash, string password);
}

public interface ITokenService
{
    string CreateAccessToken(User user, IEnumerable<string> permissions);
    string CreateRefreshToken();
    string HashRefreshToken(string token);
}

public sealed record AuthResult(string AccessToken, string RefreshToken, DateTimeOffset ExpiresAt);

public interface ICurrentUser
{
    Guid Id { get; }
}

public interface IMercadoPagoPointClient
{
    Task<MercadoPagoPointOrder> CreateOrderAsync(
        string externalReference,
        string idempotencyKey,
        decimal amount,
        string terminalId,
        CancellationToken cancellationToken);
    Task<MercadoPagoPointOrder> GetOrderAsync(string orderId, CancellationToken cancellationToken);
    Task<MercadoPagoPointOrder> CancelOrderAsync(
        string orderId,
        string idempotencyKey,
        bool allowAtTerminal,
        CancellationToken cancellationToken);
}

public interface IMercadoPagoWebhookValidator
{
    bool IsValid(string signature, string requestId, string dataId);
    bool IsExpectedApplication(string? applicationId);
}

public sealed record MercadoPagoPointOrder(
    string Id,
    string ExternalReference,
    string Status,
    string StatusDetail,
    decimal? TotalPaidAmount,
    IReadOnlyCollection<MercadoPagoPointTransaction> Payments);

public sealed record MercadoPagoPointTransaction(
    string Id,
    decimal Amount,
    decimal? PaidAmount,
    string Status,
    string StatusDetail,
    string? PaymentMethodType,
    string? PaymentMethodId,
    int? Installments);
