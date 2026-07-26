namespace JiuDiary.Api.Contracts.Auth;

/// <summary>
/// Данные для создания новой учётной записи.
/// </summary>
/// <param name="Login">Уникальный логин пользователя.</param>
/// <param name="Name">Отображаемое имя пользователя.</param>
/// <param name="Password">Пароль длиной от 8 до 128 символов.</param>
public sealed record RegisterRequest(string? Login, string? Name, string? Password);
