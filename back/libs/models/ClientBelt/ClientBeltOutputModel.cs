namespace JiuDiary.Models.ClientBelt;

public sealed class ClientBeltOutputModel
{
    public Guid Id { get; set; }

    public int BeltId { get; set; }

    public string BeltName { get; set; } = string.Empty;

    public DateOnly? ReceivedDate { get; set; }

    public int StripesCount { get; set; }
}
