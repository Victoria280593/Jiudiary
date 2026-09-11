using JiuDiary.Models.ClientTraining;
using JiuDiary.Models.ClientDayNote;

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

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public ClientTrainingOutputModel? ClientTraining { get; set; }
}

/// <summary>
/// Данные календаря текущего пользователя: доступные тренировки и его личные заметки по дням.
/// </summary>
public sealed class TrainingsOutputModel
{
    public List<TrainingOutputModel> Trainings { get; set; } = [];

    public List<GetClientDayNoteOutputModel> Notes { get; set; } = [];
}
