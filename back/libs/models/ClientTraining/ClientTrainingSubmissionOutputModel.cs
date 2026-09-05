namespace JiuDiary.Models.ClientTraining;

public sealed class ClientTrainingSubmissionOutputModel
{
    public int SubmissionId { get; set; }

    public string NameRu { get; set; } = string.Empty;

    public string NameEn { get; set; } = string.Empty;

    public int Count { get; set; }
}
