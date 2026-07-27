namespace JiuDiary.Models.Auth;

/// <summary>
/// Запрос завершения refresh-сессии.
/// </summary>
public sealed class LogoutInputModel
{
    /// <summary>
    /// Refresh-токен завершаемой сессии.
    /// </summary>
    public string? RefreshToken { get; set; }
}
