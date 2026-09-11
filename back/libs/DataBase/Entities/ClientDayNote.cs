using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Database.Entities;

/// <summary>
/// Личная заметка клиента за определённый календарный день.
/// </summary>
[Table("ClientDayNotes")]
[Index(nameof(ClientInfoId), nameof(Date), IsUnique = true)]
public sealed class ClientDayNote : IAuditable
{
    /// <summary>
    /// Уникальный идентификатор заметки.
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    /// <summary>
    /// Идентификатор клиента, которому принадлежит заметка.
    /// </summary>
    [ForeignKey(nameof(ClientInfo))]
    public Guid ClientInfoId { get; set; }

    /// <summary>
    /// Календарная дата заметки.
    /// </summary>
    public DateOnly Date { get; set; }

    /// <summary>
    /// Дата и время создания заметки.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Дата и время последнего изменения заметки.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Текст заметки длиной не более 500 символов.
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Text { get; set; } = string.Empty;

    /// <summary>
    /// Клиент, которому принадлежит заметка.
    /// </summary>
    public ClientInfo ClientInfo { get; set; } = null!;
}
