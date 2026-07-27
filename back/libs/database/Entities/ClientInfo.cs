using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JiuDiary.Database.Entities;

/// <summary>
/// Дополнительная информация о клиенте, связанная с пользователем.
/// </summary>
[Table("ClientInfo")]
public sealed class ClientInfo
{
    /// <summary>
    /// Идентификатор пользователя и первичный ключ записи.
    /// </summary>
    [Key]
    [ForeignKey(nameof(User))]
    public Guid UserId { get; set; }

    /// <summary>
    /// Страна клиента.
    /// </summary>
    [MaxLength(100)]
    public string? Country { get; set; }

    /// <summary>
    /// Город клиента.
    /// </summary>
    [MaxLength(100)]
    public string? City { get; set; }

    /// <summary>
    /// Дата рождения клиента.
    /// </summary>
    public DateOnly? BirthDate { get; set; }

    /// <summary>
    /// Пояс клиента. Пока хранится как текст.
    /// </summary>
    [MaxLength(100)]
    public string? Belt { get; set; }

    /// <summary>
    /// Количество страйпов на поясе.
    /// </summary>
    public int StripesCount { get; set; }

    /// <summary>
    /// Пользователь, которому принадлежит информация.
    /// </summary>
    public User User { get; set; } = null!;
}
