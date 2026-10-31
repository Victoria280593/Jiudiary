namespace JiuDiary.Admin.Models;

public sealed class BackupPageViewModel
{
    public IReadOnlyList<BackupListItemViewModel> Items { get; init; } = [];

    public long TotalBytes { get; init; }
}
