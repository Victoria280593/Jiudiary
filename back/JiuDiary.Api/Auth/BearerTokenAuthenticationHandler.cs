using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace JiuDiary.Api.Auth;

public sealed class BearerTokenAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    ITokenStore tokenStore)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "TemporaryBearer";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var token = ReadToken(Request);
        if (token is null)
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var user = tokenStore.FindUser(token);
        if (user is null)
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid or expired access token."));
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Login),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role),
        };
        var identity = new ClaimsIdentity(claims, SchemeName);
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }

    public static string? ReadToken(HttpRequest request)
    {
        const string prefix = "Bearer ";
        var authorization = request.Headers.Authorization.ToString();

        return authorization.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
            ? authorization[prefix.Length..].Trim()
            : null;
    }
}
