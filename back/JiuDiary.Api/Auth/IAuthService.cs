using JiuDiary.Api.Contracts.Auth;

namespace JiuDiary.Api.Auth;

/// <summary>
/// Выполняет вход, обновление токенов и завершение пользовательских сессий.
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Проверяет логин и пароль и создаёт новую сессию.
    /// </summary>
    Task<LoginResponse?> LoginAsync(
        string login,
        string password,
        CancellationToken cancellationToken);

    /// <summary>
    /// Выполняет одноразовую ротацию refresh-токена.
    /// </summary>
    Task<LoginResponse?> RefreshAsync(
        string refreshToken,
        CancellationToken cancellationToken);

    /// <summary>
    /// Отзывает refresh-сессию.
    /// </summary>
    Task LogoutAsync(
        string refreshToken,
        CancellationToken cancellationToken);
}
