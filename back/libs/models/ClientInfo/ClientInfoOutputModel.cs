namespace JiuDiary.Models.ClientInfo;

public sealed class ClientInfoOutputModel
{
    public string? Country { get; set; }

    public DateOnly? BirthDate { get; set; }

    public string? Belt { get; set; }

    public int StripesCount { get; set; }
}
