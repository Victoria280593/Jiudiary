using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace JiuDiary.Api.Auth;

/// <summary>
/// Выпускает JWT, подписанные симметричным ключом HMAC-SHA256.
/// </summary>
public sealed class JwtTokenService(IOptions<JwtOptions> options) : IJwtTokenService
{
    private readonly JwtOptions _options = options.Value;

    /// <summary>
    /// Формирует и подписывает access-токен, который клиент передаёт в заголовке Authorization.
    /// </summary>
    /// <param name="user">Проверенный пользователь и его роль.</param>
    /// <returns>JWT и время его окончания; сам access-токен в БД не сохраняется.</returns>
    public IssuedAccessToken Issue(AuthenticatedUser user)
    {
        var now = DateTimeOffset.Now;
        var expiresAt = now.AddMinutes(_options.AccessTokenMinutes);

        // Claims — минимальные данные, которые API затем читает из проверенного JWT.
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Login),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };

        // Подпись не даёт изменить содержимое JWT без знания серверного SigningKey.
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey)),
            SecurityAlgorithms.HmacSha256);

        // Токен действителен только для заданных Issuer, Audience и временного интервала.
        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now.DateTime,
            expires: expiresAt.DateTime,
            signingCredentials: credentials);

        // JWT сериализуется в строку и возвращается клиенту; сервер хранит только ключ подписи.
        return new IssuedAccessToken(
            new JwtSecurityTokenHandler().WriteToken(token),
            expiresAt);
    }
}
