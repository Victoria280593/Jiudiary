using System.ComponentModel.DataAnnotations;

namespace JiuDiary.Models.Training;

/// <summary>
/// Входная модель редактирования тренировки.
/// </summary>
public class UpdateTrainingInputModel
{
    public Guid GroupId { get; set; }

    [MaxLength(300)]
    public string? Description { get; set; }

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }
}
