using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Database.Entities;

/// <summary>
/// Дополнительная информация о клиенте, связанная с пользователем.
/// </summary>
[Table("ClientInfo")]
[Index(nameof(UserId), IsUnique = true)]
public sealed class ClientInfo
{
    /// <summary>
    /// Идентификатор пользователя и первичный ключ записи.
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    /// <summary>
    /// Идентификатор пользователя и уникальная ссылка на пользователя.
    /// </summary>
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
    /// Идентификатор пояса клиента.
    /// </summary>
    [ForeignKey(nameof(Belt))]
    public int? BeltId { get; set; }

    /// <summary>
    /// Пользователь, которому принадлежит информация.
    /// </summary>
    public User User { get; set; } = null!;

    public Belt? Belt { get; set; }
}
