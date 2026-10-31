using System.Security.Claims;
using JiuDiary.Database;
using JiuDiary.Database.Entities;
using JiuDiary.Database.Enums;
using JiuDiary.Admin.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Admin.Controllers;

public sealed class AccountController(
    JiuDiaryDbContext dbContext,
    IPasswordHasher<User> passwordHasher,
    AdminAuditService auditService) : Controller
{
    [AllowAnonymous]
    [HttpGet]
    public IActionResult Login(string? returnUrl = null)
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            return RedirectToAction("Index", "Users");
        }

        ViewData["ReturnUrl"] = returnUrl;
        return View();
    }

    [AllowAnonymous]
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(
        string login,
        string password,
        string? returnUrl,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(login) || string.IsNullOrWhiteSpace(password))
        {
            await auditService.WriteAsync(login?.Trim() ?? "unknown", "Авторизация", "POST", "/account/login", 400, "Пустые учетные данные", HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
            ModelState.AddModelError(string.Empty, "Введите логин и пароль.");
            ViewData["ReturnUrl"] = returnUrl;
            return View();
        }

        var user = await dbContext.Users
            .Include(item => item.Role)
            .SingleOrDefaultAsync(
                item => item.Login == login.Trim() &&
                        item.RoleId == (int)UserRolesEnum.Admin,
                cancellationToken);

        if (user is null || !user.IsActive || string.IsNullOrWhiteSpace(user.PasswordHash) ||
            passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password) == PasswordVerificationResult.Failed)
        {
            await auditService.WriteAsync(login.Trim(), "Авторизация", "POST", "/account/login", 401, "Неверный логин или пароль", HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
            ModelState.AddModelError(string.Empty, "Неверный логин или пароль.");
            ViewData["ReturnUrl"] = returnUrl;
            return View();
        }

        user.LastLoginAt = GetMoscowNow();
        await dbContext.SaveChangesAsync(cancellationToken);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Login),
            new Claim(ClaimTypes.Role, UserRolesEnum.Admin.ToString())
        };
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity));
        await auditService.WriteAsync(user.Login, "Авторизация", "POST", "/account/login", 200, "Успешный вход", HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);

        return Url.IsLocalUrl(returnUrl)
            ? Redirect(returnUrl!)
            : RedirectToAction("Index", "Users");
    }

    [Authorize]
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        await auditService.WriteAsync(User.Identity?.Name ?? "unknown", "Выход", "POST", "/account/logout", 200, "Выход из админки", HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return RedirectToAction(nameof(Login));
    }

    [AllowAnonymous]
    public IActionResult Denied() => View();

    [AllowAnonymous]
    public IActionResult Error() => View("Error");

    private static DateTime GetMoscowNow()
    {
        foreach (var timeZoneId in new[] { "Europe/Moscow", "Russian Standard Time" })
        {
            try
            {
                return TimeZoneInfo.ConvertTimeFromUtc(
                    DateTime.UtcNow,
                    TimeZoneInfo.FindSystemTimeZoneById(timeZoneId));
            }
            catch (TimeZoneNotFoundException)
            {
            }
            catch (InvalidTimeZoneException)
            {
            }
        }

        return DateTime.UtcNow.AddHours(3);
    }
}
