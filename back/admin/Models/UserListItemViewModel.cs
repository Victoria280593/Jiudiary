namespace JiuDiary.Admin.Models;

public sealed class UserListItemViewModel
{
    public Guid Id { get; init; }

    public string Login { get; init; } = string.Empty;

    public string Role { get; init; } = string.Empty;

    public DateTime CreatedAt { get; init; }

    public DateTime? LastLoginAt { get; init; }

    public DateTime? LastPasswordChangedAt { get; init; }

    public bool IsActive { get; init; }
}
