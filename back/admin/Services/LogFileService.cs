using JiuDiary.Admin.Models;

namespace JiuDiary.Admin.Services;

public sealed class LogFileService(IConfiguration configuration)
{
    public LogsPageViewModel GetLogs()
    {
        var directoryPath = configuration["JIUDIARY_LOG_DIRECTORY"] ?? "/logs/jiuDiary";
        if (!Directory.Exists(directoryPath))
        {
            return new LogsPageViewModel { DirectoryPath = directoryPath };
        }

        var files = Directory.EnumerateFiles(directoryPath, "*", SearchOption.AllDirectories)
            .Select(path => new FileInfo(path))
            .Where(file => file.Exists)
            .OrderByDescending(file => file.LastWriteTimeUtc)
            .Select(file => new LogFileItemViewModel
            {
                Name = Path.GetRelativePath(directoryPath, file.FullName),
                ModifiedAt = file.LastWriteTime,
                SizeBytes = file.Length
            })
            .ToList();

        return new LogsPageViewModel
        {
            Items = files,
            TotalBytes = files.Sum(file => file.SizeBytes),
            DirectoryPath = directoryPath
        };
    }
}
