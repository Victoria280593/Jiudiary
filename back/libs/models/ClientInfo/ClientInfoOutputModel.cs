namespace JiuDiary.Models.ClientInfo;

/// <summary>
/// Данные профиля клиента.
/// </summary>
public sealed class ClientInfoOutputModel
{
    /// <summary>
    /// Имя клиента.
    /// </summary>
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// Фамилия клиента.
    /// </summary>
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// Необязательное отчество клиента.
    /// </summary>
    public string? MiddleName { get; set; }

    /// <summary>
    /// Дата рождения клиента.
    /// </summary>
    public DateOnly? BirthDate { get; set; }

    /// <summary>
    /// Идентификатор пояса клиента.
    /// </summary>
    public int? BeltId { get; set; }

    /// <summary>
    /// Название пояса клиента.
    /// </summary>
    public string? BeltName { get; set; }
}
