namespace JiuDiary.Api.Contracts.Auth;

/// <summary>
/// Запрос ротации refresh-токена.
/// </summary>
/// <param name="RefreshToken">Текущий refresh-токен.</param>
public sealed record RefreshRequest(string? RefreshToken);
