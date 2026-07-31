namespace JiuDiary.Models.Group;

/// <summary>
/// Выходная модель группы тренера.
/// </summary>
public class GetGroupsOutputModel
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;
}
