using JiuDiary.Database.Enums;

namespace JiuDiary.Models.Trainer;

public sealed class StudentRequestOutputModel
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }

    public string StudentName { get; set; } = string.Empty;

    public string StudentLogin { get; set; } = string.Empty;

    public Guid CoachId { get; set; }

    public string CoachName { get; set; } = string.Empty;

    public string CoachLogin { get; set; } = string.Empty;

    public StudentRequestStatusEnum Status { get; set; }

    public DateTime CreateDate { get; set; }
}
