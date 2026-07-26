namespace JiuDiary.Api.Contracts.Auth;

/// <summary>
/// Результат успешного входа или обновления сессии.
/// </summary>
/// <param name="AccessToken">Короткоживущий JWT.</param>
/// <param name="TokenType">Тип токена, всегда Bearer.</param>
/// <param name="ExpiresAt">Срок действия JWT.</param>
/// <param name="RefreshToken">Одноразовый токен обновления сессии.</param>
/// <param name="RefreshExpiresAt">Срок действия refresh-сессии.</param>
/// <param name="User">Авторизованный пользователь.</param>
public sealed record LoginResponse(
    string AccessToken,
    string TokenType,
    DateTimeOffset ExpiresAt,
    string RefreshToken,
    DateTimeOffset RefreshExpiresAt,
    UserResponse User);
