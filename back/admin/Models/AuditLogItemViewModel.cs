namespace JiuDiary.Admin.Models;

public sealed class AuditLogItemViewModel
{
    public DateTime CreatedAt { get; init; }

    public string ActorLogin { get; init; } = string.Empty;

    public string EventType { get; init; } = string.Empty;

    public string Action { get; init; } = string.Empty;

    public string Path { get; init; } = string.Empty;

    public int StatusCode { get; init; }

    public string? Details { get; init; }

    public string? IpAddress { get; init; }
}
