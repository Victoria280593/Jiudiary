namespace JiuDiary.Database.Entities;

/// <summary>
/// Сущность с автоматически заполняемыми датами создания и изменения.
/// </summary>
public interface IAuditable
{
    DateTime CreatedAt { get; set; }

    DateTime? UpdatedAt { get; set; }
}
