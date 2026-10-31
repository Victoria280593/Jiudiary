using JiuDiary.Admin.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JiuDiary.Admin.Controllers;

[Authorize(Policy = "AdminOnly")]
public sealed class MonitoringController(DatabaseBackupService databaseBackupService) : Controller
{
    [HttpGet]
    public async Task<IActionResult> Index(CancellationToken cancellationToken)
    {
        var backups = await databaseBackupService.GetBackupsAsync(50, cancellationToken);
        return View(backups);
    }
}
