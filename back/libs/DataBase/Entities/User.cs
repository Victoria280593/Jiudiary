using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Database.Entities;

/// <summary>
/// Учётная запись пользователя JiuDiary.
/// </summary>
[Table("Users")]
[Index(nameof(Login), IsUnique = true)]
public sealed class User
{
    /// <summary>
    /// Уникальный идентификатор пользователя.
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    /// <summary>
    /// Уникальный логин пользователя.
    /// </summary>
    [Required]
    [MaxLength(256)]
    public string Login { get; set; } = string.Empty;

    /// <summary>
    /// Отображаемое имя пользователя.
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Хеш пароля в формате ASP.NET Core Identity.
    /// </summary>
    [MaxLength(512)]
    public string? PasswordHash { get; set; }

    /// <summary>
    /// Признак разрешённого входа в систему.
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Идентификатор назначенной роли.
    /// </summary>
    [ForeignKey(nameof(Role))]
    public int RoleId { get; set; }

    /// <summary>
    /// Назначенная пользователю роль.
    /// </summary>
    public Role Role { get; set; } = null!;

    /// <summary>
    /// Refresh-сессии пользователя.
    /// </summary>
    public ICollection<AuthSession> AuthSessions { get; set; } = [];

    /// <summary>
    /// Дополнительная информация о клиенте.
    /// </summary>
    public ClientInfo? ClientInfo { get; set; }

    public ICollection<StudentRequest> SentStudentRequests { get; set; } = [];

    public ICollection<StudentRequest> ReceivedStudentRequests { get; set; } = [];
}
