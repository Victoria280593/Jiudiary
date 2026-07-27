namespace JiuDiary.Models.Auth;

/// <summary>
/// Результат успешного входа или обновления сессии.
/// </summary>
public sealed class LoginOutputModel
{
    /// <summary>
    /// Короткоживущий JWT.
    /// </summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// Тип токена.
    /// </summary>
    public string TokenType { get; set; } = "Bearer";

    /// <summary>
    /// Срок действия JWT.
    /// </summary>
    public DateTimeOffset ExpiresAt { get; set; }

    /// <summary>
    /// Одноразовый токен обновления сессии.
    /// </summary>
    public string RefreshToken { get; set; } = string.Empty;

    /// <summary>
    /// Срок действия refresh-токена.
    /// </summary>
    public DateTimeOffset RefreshExpiresAt { get; set; }

    /// <summary>
    /// Авторизованный пользователь.
    /// </summary>
    public UserOutputModel User { get; set; } = new();
}
