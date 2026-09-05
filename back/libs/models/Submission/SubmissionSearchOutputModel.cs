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
    /// Каноническое русскоязычное название приёма.
    /// </summary>
    public string NameRu { get; set; } = string.Empty;

    /// <summary>
    /// Каноническое англоязычное название приёма.
    /// </summary>
    public string NameEn { get; set; } = string.Empty;
}
