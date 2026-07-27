using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Database.Entities;

/// <summary>
/// Роль пользователя, определяющая доступ к функциям системы.
/// </summary>
[Table("Roles")]
[Index(nameof(Name), IsUnique = true)]
public sealed class Role
{
    /// <summary>
    /// Числовой идентификатор роли.
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int Id { get; set; }

    /// <summary>
    /// Уникальное системное имя роли.
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Пользователи, которым назначена роль.
    /// </summary>
    public ICollection<User> Users { get; set; } = [];
}
