using JiuDiary.Database.Enums;

namespace JiuDiary.Models.Auth;

/// <summary>
/// Данные для создания новой учетной записи.
/// </summary>
public sealed class RegisterInputModel
{
    /// <summary>
    /// Уникальный логин пользователя.
    /// </summary>
    public string? Login { get; set; }

    /// <summary>
    /// Имя пользователя.
    /// </summary>
    public string? FirstName { get; set; }

    /// <summary>
    /// Фамилия пользователя.
    /// </summary>
    public string? LastName { get; set; }

    /// <summary>
    /// Необязательное отчество пользователя.
    /// </summary>
    public string? MiddleName { get; set; }

    /// <summary>
    /// Пароль длиной от 8 до 128 символов.
    /// </summary>
    public string? Password { get; set; }

    /// <summary>
    /// Роль создаваемого пользователя: Coach или Student.
    /// </summary>
    public UserRolesEnum Role { get; set; }
}
