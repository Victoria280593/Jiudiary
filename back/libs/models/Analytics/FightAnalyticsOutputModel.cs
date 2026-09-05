namespace JiuDiary.Models.Analytics;

public sealed class FightAnalyticsOutputModel
{
    public DateOnly FromDate { get; set; }

    public DateOnly ToDate { get; set; }

    public int AllTimeFightsCount { get; set; }

    public int PeriodFightsCount { get; set; }

    public int AllTimeTrainingsCount { get; set; }

    public int PeriodTrainingsCount { get; set; }

    public int AllTimeSubmissionsCount { get; set; }

    public int PeriodSubmissionsCount { get; set; }

    public decimal AllTimeAverageFightsPerTraining { get; set; }

    public decimal PeriodAverageFightsPerTraining { get; set; }

    public List<FightAnalyticsPointOutputModel> Points { get; set; } = [];

    public List<SubmissionAnalyticsPointOutputModel> SubmissionDistribution { get; set; } = [];

    public List<SubmissionAnalyticsPointOutputModel> AllTimeSubmissionDistribution { get; set; } = [];
}
