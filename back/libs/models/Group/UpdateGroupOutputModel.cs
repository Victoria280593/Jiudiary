namespace JiuDiary.Models.Group;

/// <summary>
/// Выходная модель отредактированной группы тренера.
/// </summary>
public class UpdateGroupOutputModel
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int ColorId { get; set; }

    public string ColorName { get; set; } = string.Empty;
}
