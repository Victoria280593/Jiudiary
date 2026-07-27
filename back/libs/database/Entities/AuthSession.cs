namespace JiuDiary.Database.Entities;

/// <summary>
/// Серверная refresh-сессия пользователя.
/// </summary>
public sealed class AuthSession
{
    /// <summary>
    /// Уникальный идентификатор сессии.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Идентификатор владельца сессии.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// SHA-256-хеш refresh-токена; исходное значение хранится только в защищённой cookie клиента.
    /// </summary>
    public string RefreshTokenHash { get; set; } = string.Empty;

    /// <summary>
    /// Момент окончания действия refresh-токена по локальному времени сервера.
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Момент создания сессии по локальному времени сервера.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Момент последней ротации сессии по локальному времени сервера.
    /// </summary>
    public DateTime? LastUsedAt { get; set; }

    /// <summary>
    /// Момент отзыва сессии по локальному времени сервера.
    /// </summary>
    public DateTime? RevokedAt { get; set; }

    /// <summary>
    /// Пользователь, которому принадлежит сессия.
    /// </summary>
    public User User { get; set; } = null!;
}
