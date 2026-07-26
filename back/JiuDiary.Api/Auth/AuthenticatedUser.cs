namespace JiuDiary.Api.Auth;

/// <summary>
/// Минимальный набор данных пользователя, включаемый в JWT.
/// </summary>
/// <param name="Id">GUID пользователя.</param>
/// <param name="Login">Уникальный логин.</param>
/// <param name="Name">Отображаемое имя.</param>
/// <param name="Role">Системное имя роли.</param>
public sealed record AuthenticatedUser(
    string Id,
    string Login,
    string Name,
    string Role);
