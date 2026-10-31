using JiuDiary.Admin.Services;
using JiuDiary.Admin.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JiuDiary.Admin.Controllers;

[Authorize(Policy = "AdminOnly")]
public sealed class MonitoringController(
    DatabaseBackupService databaseBackupService,
    LogFileService logFileService) : Controller
{
    [HttpGet]
    public IActionResult Index() => RedirectToAction(nameof(Backups));

    [HttpGet]
    public async Task<IActionResult> Backups(CancellationToken cancellationToken)
    {
        var backups = await databaseBackupService.GetBackupsAsync(50, cancellationToken);
        return View(new BackupPageViewModel
        {
            Items = backups,
            TotalBytes = backups.Sum(item => item.SizeBytes)
        });
    }

    [HttpGet]
    public IActionResult Logs() => View(logFileService.GetLogs());
}
