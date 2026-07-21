namespace JiuDiary.Api.Auth;

public sealed record AuthenticatedUser(
    string Id,
    string Login,
    string Name,
    string Role);
