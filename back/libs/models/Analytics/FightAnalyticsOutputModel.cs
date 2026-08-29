namespace JiuDiary.Models.Analytics;

public sealed class FightAnalyticsOutputModel
{
    public DateOnly FromDate { get; set; }

    public DateOnly ToDate { get; set; }

    public int FightsCount { get; set; }

    public List<FightAnalyticsPointOutputModel> Points { get; set; } = [];
}
