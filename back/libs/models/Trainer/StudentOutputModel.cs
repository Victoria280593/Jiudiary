namespace JiuDiary.Models.Trainer;

public sealed class StudentOutputModel
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Login { get; set; } = string.Empty;

    public int? BeltId { get; set; }

    public string? BeltName { get; set; }

    public DateTime? TrainingStartedAt { get; set; }

    public int TrainingsLast30Days { get; set; }

    public int TotalFights { get; set; }

    public double AverageFightsPerTraining { get; set; }

    public List<StudentGroupOutputModel> Groups { get; set; } = [];
}

public sealed class StudentGroupOutputModel
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string ColorName { get; set; } = string.Empty;
}

public sealed class UpdateStudentGroupsInputModel
{
    public List<Guid> GroupIds { get; set; } = [];
}
