namespace JiuDiary.Database.Entities;

/// <summary>
/// Учётная запись пользователя JiuDiary.
/// </summary>
public sealed class User
{
    /// <summary>
    /// Уникальный идентификатор пользователя.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Уникальный логин пользователя.
    /// </summary>
    public string Login { get; set; } = string.Empty;

    /// <summary>
    /// Отображаемое имя пользователя.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Хеш пароля в формате ASP.NET Core Identity.
    /// </summary>
    public string? PasswordHash { get; set; }

    /// <summary>
    /// Признак разрешённого входа в систему.
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Идентификатор назначенной роли.
    /// </summary>
    public int RoleId { get; set; }

    /// <summary>
    /// Назначенная пользователю роль.
    /// </summary>
    public Role Role { get; set; } = null!;

    /// <summary>
    /// Refresh-сессии пользователя.
    /// </summary>
    public ICollection<AuthSession> AuthSessions { get; set; } = [];
}
