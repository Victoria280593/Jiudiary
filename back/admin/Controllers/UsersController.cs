using JiuDiary.Admin.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JiuDiary.Admin.Controllers;

[Authorize(Policy = "AdminOnly")]
public sealed class UsersController(AdminUserService adminUserService) : Controller
{
    [HttpGet]
    public async Task<IActionResult> Index(string? search, CancellationToken cancellationToken)
    {
        ViewData["Search"] = search?.Trim();
        var users = await adminUserService.GetUsersAsync(search, cancellationToken);
        return View(users);
    }
}
