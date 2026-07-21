namespace JiuDiary.Api.Auth;

public interface IUserAuthenticator
{
    AuthenticatedUser? Authenticate(string login, string password);
}
