using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;

namespace JiuDiary.Api.Auth;

public sealed class HardcodedUserAuthenticator(IOptions<TemporaryAuthOptions> options)
    : IUserAuthenticator
{
    private readonly TemporaryAuthOptions _options = options.Value;

    public AuthenticatedUser? Authenticate(string login, string password)
    {
        if (!FixedTimeEquals(_options.Login, login.Trim()) ||
            !FixedTimeEquals(_options.Password, password))
        {
            return null;
        }

        return new AuthenticatedUser(
            "temporary-admin",
            _options.Login,
            _options.Name,
            _options.Role);
    }

    private static bool FixedTimeEquals(string expected, string actual)
    {
        var expectedHash = SHA256.HashData(Encoding.UTF8.GetBytes(expected));
        var actualHash = SHA256.HashData(Encoding.UTF8.GetBytes(actual));
        return CryptographicOperations.FixedTimeEquals(expectedHash, actualHash);
    }
}
