namespace JiuDiary.Api.Auth;

public sealed class TemporaryAuthOptions
{
    public const string SectionName = "TemporaryAuth";

    public string Login { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string Name { get; init; } = "Administrator";
    public string Role { get; init; } = "ADMIN";
}
