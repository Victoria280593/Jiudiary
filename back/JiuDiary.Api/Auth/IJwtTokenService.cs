namespace JiuDiary.Api.Auth;

/// <summary>
/// Создаёт подписанные JWT access-токены.
/// </summary>
public interface IJwtTokenService
{
    /// <summary>
    /// Создаёт JWT для указанного пользователя.
    /// </summary>
    IssuedAccessToken Issue(AuthenticatedUser user);
}
