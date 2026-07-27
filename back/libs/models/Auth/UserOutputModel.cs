namespace JiuDiary.Models.Auth;

/// <summary>
/// Публичные данные авторизованного пользователя.
/// </summary>
public sealed class UserOutputModel
{
    /// <summary>
    /// GUID пользователя.
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Логин пользователя.
    /// </summary>
    public string Login { get; set; } = string.Empty;

    /// <summary>
    /// Отображаемое имя пользователя.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Системное имя роли.
    /// </summary>
    public string Role { get; set; } = string.Empty;
}
