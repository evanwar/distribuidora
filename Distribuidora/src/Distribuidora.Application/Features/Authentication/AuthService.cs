using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Specifications;
using Distribuidora.Application.Security;
using Distribuidora.Contracts.Requests;
using Distribuidora.Domain.Security;

namespace Distribuidora.Application.Features.Authentication;

public sealed class AuthService(
    IAppDbContext db,
    IPasswordService passwords,
    ITokenService tokens,
    IDatatimeProvider datetimeProvider)
{
    public async Task<AuthResult> LoginAsync(LoginRequest request, string ip, CancellationToken ct)
    {
        var user = db.Query(Specification.Create<User>(x => x.Username == request.Username)).SingleOrDefault();
        if (user is null || !user.Active || !passwords.Verify(user.PasswordHash, request.Password))
            throw new UnauthorizedException("Invalid credentials.");

        var permissions = user.Roles.Where(x => x.Active).SelectMany(x => x.Permissions).Select(x => x.Key).Distinct().ToArray();
        var refresh = tokens.CreateRefreshToken();
        var utcNow = datetimeProvider.UtcNow;
        var expires = utcNow.AddDays(AuthenticationDefaults.RefreshTokenLifetimeDays);
        db.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = tokens.HashRefreshToken(refresh),
            ExpiresAt = expires,
            CreatedByIp = ip
        });
        user.LastAccessAt = utcNow;
        await db.SaveChangesAsync(ct);
        return new AuthResult(tokens.CreateAccessToken(user, permissions), refresh, expires);
    }

    public Task<AuthResult> RefreshAsync(string refreshToken, string ip, CancellationToken ct) =>
        db.ExecuteAtomicAsync(async token =>
    {
        var hash = tokens.HashRefreshToken(refreshToken);
        var stored = db.Query(Specification.Create<RefreshToken>(x => x.TokenHash == hash)).SingleOrDefault();
        var utcNow = datetimeProvider.UtcNow;
        if (stored is null || stored.RevokedAt is not null || stored.ExpiresAt <= utcNow)
            throw new UnauthorizedException("Refresh token is invalid or expired.");
        var user = db.Query(Specification.Create<User>(x => x.Id == stored.UserId)).Single();
        if (!user.Active) throw new UnauthorizedException("User is inactive.");
        stored.RevokedAt = utcNow;
        var raw = tokens.CreateRefreshToken();
        var expires = datetimeProvider.UtcNow.AddDays(AuthenticationDefaults.RefreshTokenLifetimeDays);
        db.Add(new RefreshToken { UserId = user.Id, TokenHash = tokens.HashRefreshToken(raw), ExpiresAt = expires, CreatedByIp = ip });
        await db.SaveChangesAsync(token);
        var permissions = user.Roles.Where(x => x.Active).SelectMany(x => x.Permissions).Select(x => x.Key).Distinct();
        return new AuthResult(tokens.CreateAccessToken(user, permissions), raw, expires);
    }, ct);

    public async Task LogoutAsync(string refreshToken, CancellationToken ct)
    {
        var hash = tokens.HashRefreshToken(refreshToken);
        var stored = db.Query(Specification.Create<RefreshToken>(x => x.TokenHash == hash)).SingleOrDefault();
        if (stored is not null) stored.RevokedAt = datetimeProvider.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
