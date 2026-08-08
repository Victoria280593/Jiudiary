using JiuDiary.Api.Auth;
using JiuDiary.Database.Enums;
using JiuDiary.Models.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace JiuDiary.Api.Controllers;

/// <summary>
/// Управляет входом пользователя и жизненным циклом JWT-сессии.
/// </summary>
[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public sealed class AuthController(IAuthService authService) : BaseController
{
    /// <summary>
    /// Создаёт нового активного тренера или ученика.
    /// </summary>
    /// <param name="request">Логин, имя и пароль нового пользователя.</param>
    /// <param name="cancellationToken">Токен отмены HTTP-запроса.</param>
    /// <returns>Созданный пользователь без пароля и его хеша.</returns>
    [HttpPost("register")]
    [ProducesResponseType<UserOutputModel>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserOutputModel>> Register(RegisterInputModel request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Login) ||
            request.Login.Trim().Length > 256 ||
            string.IsNullOrWhiteSpace(request.Name) ||
            request.Name.Trim().Length > 200 ||
            request.Password is null ||
            request.Password.Length is < 8 or > 128 ||
            request.Role is not (UserRolesEnum.Coach or UserRolesEnum.Student))
        {
            return BadRequest(new
            {
                error = "Логин и имя обязательны, пароль должен содержать от 8 до 128 символов."
            });
        }

        UserOutputModel? user;
        try
        {
            user = await authService.RegisterAsync(request, cancellationToken);
        }
        catch (InvalidOperationException exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = exception.Message });
        }

        return user is null
            ? Conflict(new { error = "Пользователь с таким логином уже существует." })
            : StatusCode(StatusCodes.Status201Created, user);
    }

    /// <summary>
    /// Проверяет логин и пароль и возвращает access/refresh-токены.
    /// </summary>
    /// <param name="request">Логин и пароль пользователя.</param>
    /// <param name="cancellationToken">Токен отмены HTTP-запроса.</param>
    /// <returns>Новая авторизационная сессия.</returns>
    [HttpPost("login")]
    [EnableRateLimiting("login")]
    [ProducesResponseType<LoginOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<LoginOutputModel>> Login(LoginInputModel request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Login) ||
            string.IsNullOrEmpty(request.Password) ||
            request.Role is not (UserRolesEnum.Coach or UserRolesEnum.Student))
        {
            return BadRequest(new { error = "Необходимо указать логин, пароль и роль." });
        }

        var response = await authService.LoginAsync(request, cancellationToken);
        return response is null ? Unauthorized() : Ok(response);
    }

    /// <summary>
    /// Обновляет JWT и выполняет ротацию refresh-токена.
    /// </summary>
    /// <param name="request">Текущий refresh-токен.</param>
    /// <param name="cancellationToken">Токен отмены HTTP-запроса.</param>
    /// <returns>Новая авторизационная сессия.</returns>
    [HttpPost("refresh")]
    [ProducesResponseType<LoginOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginOutputModel>> Refresh(RefreshInputModel request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest(new { error = "Необходимо передать refresh-токен." });
        }

        var response = await authService.RefreshAsync(request, cancellationToken);
        return response is null ? Unauthorized() : Ok(response);
    }

    /// <summary>
    /// Возвращает данные пользователя из проверенного JWT.
    /// </summary>
    /// <returns>Текущий пользователь и его роль.</returns>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType<UserOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<UserOutputModel> Me() =>
        Ok(new UserOutputModel
        {
            Id = CurrentUser.Id.ToString(),
            Login = CurrentUser.Login,
            Name = CurrentUser.Name,
            Role = CurrentUser.Role.ToString().ToUpperInvariant()
        });

    /// <summary>
    /// Отзывает refresh-сессию пользователя.
    /// </summary>
    /// <param name="request">Refresh-токен завершаемой сессии.</param>
    /// <param name="cancellationToken">Токен отмены HTTP-запроса.</param>
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(LogoutInputModel request, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            await authService.LogoutAsync(request, cancellationToken);
        }

        return NoContent();
    }
}
