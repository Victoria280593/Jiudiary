namespace JiuDiary.Models.Auth;

/// <summary>
/// Данные для создания новой учетной записи.
/// </summary>
public sealed class RegisterInputModel
{
    /// <summary>
    /// Уникальный логин пользователя.
    /// </summary>
    public string? Login { get; set; }

    /// <summary>
    /// Отображаемое имя пользователя.
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// Пароль длиной от 8 до 128 символов.
    /// </summary>
    public string? Password { get; set; }
}
