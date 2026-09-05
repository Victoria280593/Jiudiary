namespace JiuDiary.Models.Submission;

/// <summary>
/// Найденный приём из словаря известных названий БЖЖ.
/// </summary>
public sealed class SubmissionSearchOutputModel
{
    /// <summary>
    /// Идентификатор приёма в таблице Submissions.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Каноническое англоязычное название приёма.
    /// </summary>
    public string Name { get; set; } = string.Empty;
}
