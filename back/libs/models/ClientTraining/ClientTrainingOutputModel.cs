namespace JiuDiary.Models.ClientTraining;

public sealed class ClientTrainingOutputModel
{
    public Guid Id { get; set; }

    public Guid TrainingId { get; set; }

    public int? Rounds { get; set; }

    public List<ClientTrainingSubmissionOutputModel> Submissions { get; set; } = [];

    public DateTime CreatedAt { get; set; }
}
