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
}
