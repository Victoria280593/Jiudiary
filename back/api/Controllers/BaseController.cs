using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using JiuDiary.Api.Auth;
using Microsoft.AspNetCore.Mvc;

namespace JiuDiary.Api.Controllers;

/// <summary>
/// Базовый контроллер для защищённых API-ручек.
/// Данные пользователя берутся из проверенного JWT-токена.
/// </summary>
public abstract class BaseController : ControllerBase
{
    /// <summary>
    /// Пользователь, данные которого были прочитаны из текущего JWT-токена.
    /// </summary>
    protected AuthenticatedUser CurrentUser =>
        TryGetCurrentUser(out var user)
            ? user
            : throw new UnauthorizedAccessException("The JWT token does not contain valid user data.");

    /// <summary>
    /// Безопасно извлекает основные данные текущего пользователя из JWT.
    /// </summary>
    protected bool TryGetCurrentUser(out AuthenticatedUser user)
    {
        var id = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        var login = User.FindFirstValue(JwtRegisteredClaimNames.Email)
            ?? User.FindFirstValue("email");
        var name = User.FindFirstValue(ClaimTypes.Name)
            ?? User.FindFirstValue("name");
        var role = User.FindFirstValue(ClaimTypes.Role)
            ?? User.FindFirstValue("role");

        if (string.IsNullOrWhiteSpace(id) ||
            string.IsNullOrWhiteSpace(login) ||
            string.IsNullOrWhiteSpace(name) ||
            string.IsNullOrWhiteSpace(role))
        {
            user = null!;
            return false;
        }

        user = new AuthenticatedUser(id, login, name, role);
        return true;
    }
}
