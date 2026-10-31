using System.Text.Json.Serialization;

namespace JiuDiary.Database.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum StudentRequestStatusEnum
{
    /// <summary>
    /// На рассмотрении
    /// </summary>
    Pending = 1,

    /// <summary>
    /// Принята
    /// </summary>
    Accepted = 2,

    /// <summary>
    /// Отклоенена
    /// </summary>
    Rejected = 3
}
