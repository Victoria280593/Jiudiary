namespace JiuDiary.Api.Auth;

/// <summary>
/// Настройки одноразового заполнения хеша пароля первого администратора.
/// </summary>
public sealed class AuthBootstrapOptions
{
    /// <summary>
    /// Имя секции конфигурации.
    /// </summary>
    public const string SectionName = "AuthBootstrap";

    /// <summary>
    /// Разрешает bootstrap-вход только для пользователя с пустым PasswordHash.
    /// </summary>
    public bool Enabled { get; init; }

    /// <summary>
    /// Логин первого администратора.
    /// </summary>
    public string Login { get; init; } = string.Empty;

    /// <summary>
    /// Временный пароль, удаляемый из окружения после первого входа.
    /// </summary>
    public string Password { get; init; } = string.Empty;
}
