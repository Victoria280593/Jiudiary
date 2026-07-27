namespace JiuDiary.Database.Entities;

/// <summary>
/// Роль пользователя, определяющая доступ к функциям системы.
/// </summary>
public sealed class Role
{
    /// <summary>
    /// Числовой идентификатор роли.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Уникальное системное имя роли.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Пользователи, которым назначена роль.
    /// </summary>
    public ICollection<User> Users { get; set; } = [];
}
