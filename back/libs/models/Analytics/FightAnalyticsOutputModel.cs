namespace JiuDiary.Models.Analytics;

public sealed class FightAnalyticsOutputModel
{
    public DateOnly FromDate { get; set; }

    public DateOnly ToDate { get; set; }

    public int AllTimeFightsCount { get; set; }

    public int PeriodFightsCount { get; set; }

    public decimal AllTimeAverageFightsPerTraining { get; set; }

    public decimal PeriodAverageFightsPerTraining { get; set; }

    public List<FightAnalyticsPointOutputModel> Points { get; set; } = [];
}
