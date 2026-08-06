namespace JiuDiary.Models.Trainer;

public sealed class TrainerOutputModel
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Login { get; set; } = string.Empty;

    public int? BeltId { get; set; }

    public string? BeltName { get; set; }
}
