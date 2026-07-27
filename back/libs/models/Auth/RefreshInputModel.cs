namespace JiuDiary.Models.Auth;

/// <summary>
/// Запрос ротации refresh-токена.
/// </summary>
public sealed class RefreshInputModel
{
    /// <summary>
    /// Текущий refresh-токен.
    /// </summary>
    public string? RefreshToken { get; set; }
}
