using System;
using System.Collections.Generic;
using System.Text;

using System.Text.Json.Serialization;

namespace JiuDiary.Database.Enums
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum UserRolesEnum : int
    {
        Admin = 1,
        Coach = 2,
        Student = 3,
    }
}
