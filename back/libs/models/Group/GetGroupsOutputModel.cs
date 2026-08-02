namespace JiuDiary.Models.Group;

/// <summary>
/// Выходная модель группы тренера.
/// </summary>
public class GetGroupsOutputModel
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int ColorId { get; set; }

    public string ColorName { get; set; } = string.Empty;

    public TimeSpan? DefaultStartTime { get; set; }

    public TimeSpan? DefaultEndTime { get; set; }
}
