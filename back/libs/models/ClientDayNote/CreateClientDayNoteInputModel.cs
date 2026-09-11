namespace JiuDiary.Models.ClientDayNote;

/// <summary>
/// Данные для создания дневной заметки текущего клиента.
/// </summary>
public sealed class CreateClientDayNoteInputModel
{
    /// <summary>
    /// Календарная дата заметки.
    /// </summary>
    public DateOnly Date { get; set; }

    /// <summary>
    /// Текст заметки длиной не более 500 символов.
    /// </summary>
    public string Text { get; set; } = string.Empty;
}
