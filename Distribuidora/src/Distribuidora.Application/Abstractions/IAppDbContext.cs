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
