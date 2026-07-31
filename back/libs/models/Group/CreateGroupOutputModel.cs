namespace JiuDiary.Models.Group;

/// <summary>
/// Выходная модель созданной группы.
/// </summary>
public class CreateGroupOutputModel
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;
}
