namespace JiuDiary.Models.ClientInfo;

/// <summary>
/// Данные для обновления профиля клиента.
/// </summary>
public sealed class UpdateClientInfoInputModel
{
    /// <summary>
    /// Имя клиента.
    /// </summary>
    public string? FirstName { get; set; }

    /// <summary>
    /// Фамилия клиента.
    /// </summary>
    public string? LastName { get; set; }

    /// <summary>
    /// Необязательное отчество клиента.
    /// </summary>
    public string? MiddleName { get; set; }

    /// <summary>
    /// Дата рождения клиента.
    /// </summary>
    public DateOnly? BirthDate { get; set; }

}
