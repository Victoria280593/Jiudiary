namespace JiuDiary.Models.ClientInfo;

public sealed class ClientInfoOutputModel
{
    public string? Country { get; set; }

    public DateOnly? BirthDate { get; set; }

    public int? BeltId { get; set; }

    public string? BeltName { get; set; }

    public int StripesCount { get; set; }
}
