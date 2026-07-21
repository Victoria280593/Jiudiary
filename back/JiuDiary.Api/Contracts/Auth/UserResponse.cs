using JiuDiary.Api.Auth;

namespace JiuDiary.Api.Contracts.Auth;

public sealed record UserResponse(string Id, string Login, string Name, string Role)
{
    public static UserResponse From(AuthenticatedUser user) =>
        new(user.Id, user.Login, user.Name, user.Role);
}
