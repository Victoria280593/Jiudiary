using System.Security.Claims;
using JiuDiary.Api.Auth;
using JiuDiary.Api.Contracts.Auth;
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
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>
    /// Создаёт нового активного тренера с ролью Coach.
    /// </summary>
    /// <param name="request">Логин, имя и пароль нового пользователя.</param>
    /// <param name="cancellationToken">Токен отмены HTTP-запроса.</param>
    /// <returns>Созданный пользователь без пароля и его хеша.</returns>
    [HttpPost("register")]
    [ProducesResponseType<UserResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserResponse>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Login) ||
            request.Login.Trim().Length > 256 ||
            string.IsNullOrWhiteSpace(request.Name) ||
            request.Name.Trim().Length > 200 ||
            request.Password is null ||
            request.Password.Length is < 8 or > 128)
        {
            return BadRequest(new
            {
                error = "Login and name are required; password must contain from 8 to 128 characters."
            });
        }

        var user = await authService.RegisterAsync(
            request.Login,
            request.Name,
            request.Password,
            cancellationToken);

        return user is null
            ? Conflict(new { error = "A user with this login already exists." })
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
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<LoginResponse>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Login) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(new { error = "Login and password are required." });
        }

        var response = await authService.LoginAsync(
            request.Login,
            request.Password,
            cancellationToken);
        return response is null ? Unauthorized() : Ok(response);
    }

    /// <summary>
    /// Обновляет JWT и выполняет ротацию refresh-токена.
    /// </summary>
    /// <param name="request">Текущий refresh-токен.</param>
    /// <param name="cancellationToken">Токен отмены HTTP-запроса.</param>
    /// <returns>Новая авторизационная сессия.</returns>
    [HttpPost("refresh")]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Refresh(
        RefreshRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest(new { error = "Refresh token is required." });
        }

        var response = await authService.RefreshAsync(
            request.RefreshToken,
            cancellationToken);
        return response is null ? Unauthorized() : Ok(response);
    }

    /// <summary>
    /// Возвращает данные пользователя из проверенного JWT.
    /// </summary>
    /// <returns>Текущий пользователь и его роль.</returns>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType<UserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<UserResponse> Me() =>
        Ok(new UserResponse(
            User.FindFirstValue("sub")!,
            User.FindFirstValue("email")!,
            User.FindFirstValue(ClaimTypes.Name)!,
            User.FindFirstValue(ClaimTypes.Role)!));

    /// <summary>
    /// Отзывает refresh-сессию пользователя.
    /// </summary>
    /// <param name="request">Refresh-токен завершаемой сессии.</param>
    /// <param name="cancellationToken">Токен отмены HTTP-запроса.</param>
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(
        LogoutRequest request,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            await authService.LogoutAsync(request.RefreshToken, cancellationToken);
        }

        return NoContent();
    }
}
