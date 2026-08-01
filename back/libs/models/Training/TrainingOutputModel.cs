namespace JiuDiary.Models.Training;

/// <summary>
/// Выходная модель тренировки.
/// </summary>
public class TrainingOutputModel
{
    public Guid Id { get; set; }

    public Guid GroupId { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public int GroupColorId { get; set; }

    public string GroupColorName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTime Time { get; set; }
}
