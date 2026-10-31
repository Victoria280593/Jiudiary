using JiuDiary.Admin.Services;
using JiuDiary.Admin.Models;
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

    [HttpGet]
    public IActionResult Create() => View(new CreateUserInputModel());

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(
        CreateUserInputModel input,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return View(input);
        }

        if (!await adminUserService.CreateUserAsync(input, cancellationToken))
        {
            ModelState.AddModelError(nameof(input.Login), "Пользователь с таким логином и ролью уже существует.");
            return View(input);
        }

        return RedirectToAction(nameof(Index));
    }
}
