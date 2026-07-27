namespace JiuDiary.Api.Auth;

/// <summary>
/// Результат создания JWT access-токена.
/// </summary>
/// <param name="Token">Подписанный JWT.</param>
/// <param name="ExpiresAt">Момент окончания действия по локальному времени сервера.</param>
public sealed record IssuedAccessToken(string Token, DateTimeOffset ExpiresAt);
