namespace JiuDiary.Models.Auth;

/// <summary>
/// Данные для входа пользователя.
/// </summary>
public sealed class LoginInputModel
{
    /// <summary>
    /// Логин пользователя.
    /// </summary>
    public string? Login { get; set; }

    /// <summary>
    /// Открытый пароль, передаваемый только по HTTPS.
    /// </summary>
    public string? Password { get; set; }
}
