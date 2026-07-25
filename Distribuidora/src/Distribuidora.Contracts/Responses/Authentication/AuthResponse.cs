namespace Distribuidora.Contracts.Responses;

public sealed record AuthResponse(string AccessToken, string RefreshToken, DateTimeOffset ExpiresAt);
