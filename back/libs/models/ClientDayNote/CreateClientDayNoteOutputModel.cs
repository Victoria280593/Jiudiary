namespace JiuDiary.Models.ClientDayNote;

/// <summary>
/// Созданная дневная заметка текущего клиента.
/// </summary>
public sealed class CreateClientDayNoteOutputModel
{
    /// <summary>
    /// Уникальный идентификатор заметки.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Календарная дата заметки.
    /// </summary>
    public DateOnly Date { get; set; }

    /// <summary>
    /// Текст заметки.
    /// </summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>
    /// Дата и время создания заметки.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Дата и время последнего изменения заметки.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
