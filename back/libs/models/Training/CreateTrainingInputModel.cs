using System.ComponentModel.DataAnnotations;

namespace JiuDiary.Models.Training;

/// <summary>
/// Входная модель создания тренировки.
/// </summary>
public class CreateTrainingInputModel
{
    public Guid GroupId { get; set; }

    [MaxLength(300)]
    public string? Description { get; set; }

    public DateTime Time { get; set; }
}
