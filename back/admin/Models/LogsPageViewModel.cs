namespace JiuDiary.Admin.Models;

public sealed class LogsPageViewModel
{
    public IReadOnlyList<LogFileItemViewModel> Items { get; init; } = [];

    public long TotalBytes { get; init; }

    public string DirectoryPath { get; init; } = string.Empty;
}
