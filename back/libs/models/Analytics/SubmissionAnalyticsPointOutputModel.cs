namespace JiuDiary.Models.Analytics;

public sealed class SubmissionAnalyticsPointOutputModel
{
    public int SubmissionId { get; set; }

    public string NameRu { get; set; } = string.Empty;

    public string NameEn { get; set; } = string.Empty;

    public int Count { get; set; }
}
