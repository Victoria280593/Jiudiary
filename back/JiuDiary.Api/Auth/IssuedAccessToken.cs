namespace JiuDiary.Api.Auth;

/// <summary>
/// Результат создания JWT access-токена.
/// </summary>
/// <param name="Token">Подписанный JWT.</param>
/// <param name="ExpiresAt">Момент окончания действия в UTC.</param>
public sealed record IssuedAccessToken(string Token, DateTimeOffset ExpiresAt);
