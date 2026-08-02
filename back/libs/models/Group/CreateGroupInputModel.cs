namespace JiuDiary.Models.Group;

/// <summary>
/// Входная модель создания группы.
/// </summary>
public class CreateGroupInputModel
{
    /// <summary>
    /// Название группы.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Идентификатор цвета группы. По умолчанию используется Brown.
    /// </summary>
    public int ColorId { get; set; } = 6;

    public TimeSpan? DefaultStartTime { get; set; }

    public TimeSpan? DefaultEndTime { get; set; }
}
