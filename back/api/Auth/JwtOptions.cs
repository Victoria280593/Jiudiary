namespace JiuDiary.Api.Auth;

/// <summary>
/// Настройки выпуска и проверки JWT.
/// </summary>
public sealed class JwtOptions
{
    /// <summary>
    /// Имя секции конфигурации.
    /// </summary>
    public const string SectionName = "Jwt";

    /// <summary>
    /// Издатель токена.
    /// </summary>
    public string Issuer { get; init; } = "JiuDiary";

    /// <summary>
    /// Получатель токена.
    /// </summary>
    public string Audience { get; init; } = "JiuDiary.Api";

    /// <summary>
    /// Секретный ключ HMAC длиной не менее 32 символов.
    /// </summary>
    public string SigningKey { get; init; } = string.Empty;

    /// <summary>
    /// Срок жизни access-токена в минутах.
    /// </summary>
    public int AccessTokenMinutes { get; init; } = 60;

    /// <summary>
    /// Срок жизни refresh-сессии в днях.
    /// </summary>
    public int RefreshTokenDays { get; init; } = 30;
}
