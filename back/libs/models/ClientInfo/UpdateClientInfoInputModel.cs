using System.ComponentModel.DataAnnotations;

namespace JiuDiary.Models.ClientInfo;

public sealed class UpdateClientInfoInputModel
{
    [MaxLength(100)]
    public string? Country { get; set; }

    public DateOnly? BirthDate { get; set; }

    [MaxLength(100)]
    public string? Belt { get; set; }

    [Range(0, 4)]
    public int StripesCount { get; set; }
}
