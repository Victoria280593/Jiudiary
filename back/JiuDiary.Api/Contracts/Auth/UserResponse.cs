using JiuDiary.Api.Auth;

namespace JiuDiary.Api.Contracts.Auth;

/// <summary>
/// Публичные данные авторизованного пользователя.
/// </summary>
/// <param name="Id">GUID пользователя.</param>
/// <param name="Login">Логин пользователя.</param>
/// <param name="Name">Отображаемое имя.</param>
/// <param name="Role">Системное имя роли.</param>
public sealed record UserResponse(string Id, string Login, string Name, string Role)
{
    /// <summary>
    /// Создаёт DTO из внутренней модели пользователя.
    /// </summary>
    public static UserResponse From(AuthenticatedUser user) =>
        new(user.Id, user.Login, user.Name, user.Role);
}
