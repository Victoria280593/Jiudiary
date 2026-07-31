using JiuDiary.Database.Enums;

namespace JiuDiary.Api.Auth;

/// <summary>
/// Актуальные данные авторизованного пользователя, загруженные из базы данных.
/// </summary>
/// <param name="Id">GUID пользователя.</param>
/// <param name="Login">Уникальный логин.</param>
/// <param name="Name">Отображаемое имя.</param>
/// <param name="Role">Роль пользователя.</param>
public sealed record AuthenticatedUser(Guid Id, string Login, string Name, UserRolesEnum Role);
