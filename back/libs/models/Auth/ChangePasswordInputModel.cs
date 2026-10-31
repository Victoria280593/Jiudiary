namespace JiuDiary.Models.Auth;

/// <summary>
/// Данные для смены пароля авторизованного пользователя.
/// </summary>
public sealed class ChangePasswordInputModel
{
    public string? CurrentPassword { get; set; }

    public string? NewPassword { get; set; }
}
