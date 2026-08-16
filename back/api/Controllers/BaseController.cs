using JiuDiary.Api.Auth;
using JiraDiary.AspCore.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace JiuDiary.Api.Controllers;

/// <summary>
/// Базовый контроллер для защищённых API-ручек.
/// </summary>
public abstract class BaseController : ControllerBase
{
    /// <summary>
    /// Актуальные данные пользователя, загруженные из базы после авторизации.
    /// </summary>
    protected AuthenticatedUser CurrentUser =>
        TryGetCurrentUser(out var user)
            ? user
            : throw new AspNetException(
                "Не удалось получить данные авторизованного пользователя.",
                StatusCodes.Status401Unauthorized);

    protected bool TryGetCurrentUser(out AuthenticatedUser user)
    {
        if (HttpContext.Items.TryGetValue(AuthenticatedUserMiddleware.HttpContextItemKey, out var value) &&
            value is AuthenticatedUser authenticatedUser)
        {
            user = authenticatedUser;
            return true;
        }

        user = null!;
        return false;
    }
}
