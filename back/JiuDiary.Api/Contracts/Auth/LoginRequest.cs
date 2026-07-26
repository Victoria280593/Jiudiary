namespace JiuDiary.Api.Contracts.Auth;

/// <summary>
/// Данные для входа пользователя.
/// </summary>
/// <param name="Login">Логин пользователя.</param>
/// <param name="Password">Открытый пароль, передаваемый только по HTTPS.</param>
public sealed record LoginRequest(string? Login, string? Password);
