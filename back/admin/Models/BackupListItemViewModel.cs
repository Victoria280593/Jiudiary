namespace JiuDiary.Admin.Models;

public sealed class BackupListItemViewModel
{
    public DateTime BackupDate { get; init; }

    public string Type { get; init; } = string.Empty;

    public long SizeBytes { get; init; }

    public string Device { get; init; } = string.Empty;
}
