namespace JiuDiary.Models.ClientBelt;

public sealed class ChangeClientBeltInputModel
{
    public int BeltId { get; set; }

    public DateOnly? ReceivedDate { get; set; }

    public int StripesCount { get; set; }
}
