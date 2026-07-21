namespace JiuDiary.Api.Auth;

public interface ITokenStore
{
    IssuedSession Issue(AuthenticatedUser user);
    AuthenticatedUser? FindUser(string token);
    void Revoke(string token);
}

public sealed record IssuedSession(string Token, DateTimeOffset ExpiresAt);
