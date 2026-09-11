namespace JiuDiary.Models.ClientDayNote;

/// <summary>
/// Данные для обновления дневной заметки текущего клиента.
/// </summary>
public sealed class UpdateClientDayNoteInputModel
{
    /// <summary>
    /// Новый текст заметки длиной не более 500 символов.
    /// </summary>
    public string Text { get; set; } = string.Empty;
}
