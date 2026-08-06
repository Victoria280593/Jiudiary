using System.Text.Json.Serialization;

namespace JiuDiary.Database.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum StudentRequestStatusEnum
{
    Pending = 1,
    Accepted = 2,
    Rejected = 3
}
