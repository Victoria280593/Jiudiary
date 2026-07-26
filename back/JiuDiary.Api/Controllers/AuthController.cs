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
