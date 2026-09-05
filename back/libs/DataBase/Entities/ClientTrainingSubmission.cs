using System.ComponentModel.DataAnnotations.Schema;

namespace JiuDiary.Database.Entities;

[Table("ClientTrainingSubmissions")]
public sealed class ClientTrainingSubmission
{
    [ForeignKey(nameof(ClientTraining))]
    public Guid ClientTrainingId { get; set; }

    [ForeignKey(nameof(Submission))]
    public int SubmissionId { get; set; }

    public int Count { get; set; }

    public ClientTraining ClientTraining { get; set; } = null!;

    public Submission Submission { get; set; } = null!;
}
