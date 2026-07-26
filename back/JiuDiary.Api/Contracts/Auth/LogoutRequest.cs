namespace JiuDiary.Api.Contracts.Auth;

/// <summary>
/// Запрос завершения refresh-сессии.
/// </summary>
/// <param name="RefreshToken">Refresh-токен завершаемой сессии.</param>
public sealed record LogoutRequest(string? RefreshToken);
