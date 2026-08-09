namespace Distribuidora.Application.Security;

public static class AuthenticationDefaults
{
    public const int MinimumPasswordLength = 8;
    public const int MaximumPasswordLength = 256;
    public const int MaximumUsernameLength = 100;
    public const int MaximumRefreshTokenLength = 512;
    public const int AccessTokenLifetimeMinutes = 30;
    public const int RefreshTokenLifetimeDays = 7;
    public const int MinimumJwtSigningKeyBytes = 32;
    public const int JwtClockSkewMinutes = 1;
    public const int LoginPermitLimit = 5;
    public const int LoginRateLimitWindowMinutes = 1;
}
