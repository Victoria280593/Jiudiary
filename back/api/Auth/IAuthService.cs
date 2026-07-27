using JiuDiary.Models.Auth;

namespace JiuDiary.Api.Auth;

/// <summary>
/// Выполняет вход, обновление токенов и завершение пользовательских сессий.
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Создаёт активного тренера с ролью Coach и сохраняет хеш пароля.
    /// </summary>
    /// <param name="login">Уникальный логин нового тренера.</param>
    /// <param name="name">Отображаемое имя.</param>
    /// <param name="password">Открытый пароль, используемый только для вычисления хеша.</param>
    /// <param name="cancellationToken">Токен отмены запроса.</param>
    /// <returns>Созданный пользователь или <see langword="null"/>, если логин занят.</returns>
    Task<UserOutputModel?> RegisterAsync(
        string login,
        string name,
        string password,
        CancellationToken cancellationToken);

    /// <summary>
    /// Проверяет логин и пароль и создаёт новую сессию.
    /// </summary>
    /// <param name="login">Логин пользователя.</param>
    /// <param name="password">Пароль для проверки по сохранённому хешу.</param>
    /// <param name="cancellationToken">Токен отмены запроса.</param>
    /// <returns>Новая пара access/refresh или <see langword="null"/> при отказе.</returns>
    Task<LoginOutputModel?> LoginAsync(
        string login,
        string password,
        CancellationToken cancellationToken);

    /// <summary>
    /// Выполняет одноразовую ротацию refresh-токена.
    /// </summary>
    /// <param name="refreshToken">Текущий refresh-токен клиента.</param>
    /// <param name="cancellationToken">Токен отмены запроса.</param>
    /// <returns>Новая пара токенов или <see langword="null"/>, если сессия недействительна.</returns>
    Task<LoginOutputModel?> RefreshAsync(
        string refreshToken,
        CancellationToken cancellationToken);

    /// <summary>
    /// Отзывает refresh-сессию.
    /// </summary>
    /// <param name="refreshToken">Refresh-токен завершаемой сессии.</param>
    /// <param name="cancellationToken">Токен отмены запроса.</param>
    Task LogoutAsync(
        string refreshToken,
        CancellationToken cancellationToken);
}
