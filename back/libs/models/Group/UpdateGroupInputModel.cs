namespace JiuDiary.Models.Group;

/// <summary>
/// Входная модель редактирования группы тренера.
/// </summary>
public class UpdateGroupInputModel
{
    public string Name { get; set; } = string.Empty;

    public int ColorId { get; set; }

    public TimeSpan? DefaultStartTime { get; set; }

    public TimeSpan? DefaultEndTime { get; set; }
}
