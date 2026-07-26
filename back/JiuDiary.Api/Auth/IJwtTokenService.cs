namespace JiuDiary.Api.Auth;

/// <summary>
/// Создаёт подписанные JWT access-токены.
/// </summary>
public interface IJwtTokenService
{
    /// <summary>
    /// Создаёт короткоживущий JWT с идентификатором, логином, именем и ролью пользователя.
    /// </summary>
    /// <param name="user">Проверенный пользователь, для которого выпускается токен.</param>
    /// <returns>Строка JWT и точное время окончания её действия.</returns>
    IssuedAccessToken Issue(AuthenticatedUser user);
}
