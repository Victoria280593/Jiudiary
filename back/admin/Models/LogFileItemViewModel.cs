namespace JiuDiary.Admin.Models;

public sealed class LogFileItemViewModel
{
    public string Name { get; init; } = string.Empty;

    public DateTime ModifiedAt { get; init; }

    public long SizeBytes { get; init; }
}
