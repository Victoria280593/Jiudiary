using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace JiuDiary.Api.Auth;

public sealed class InMemoryTokenStore : ITokenStore
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromHours(8);
    private readonly ConcurrentDictionary<string, SessionEntry> _sessions = new();

    public IssuedSession Issue(AuthenticatedUser user)
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        var expiresAt = DateTimeOffset.UtcNow.Add(Lifetime);

        _sessions[token] = new SessionEntry(user, expiresAt);
        return new IssuedSession(token, expiresAt);
    }

    public AuthenticatedUser? FindUser(string token)
    {
        if (!_sessions.TryGetValue(token, out var session))
        {
            return null;
        }

        if (session.ExpiresAt > DateTimeOffset.UtcNow)
        {
            return session.User;
        }

        _sessions.TryRemove(token, out _);
        return null;
    }

    public void Revoke(string token) => _sessions.TryRemove(token, out _);

    private sealed record SessionEntry(AuthenticatedUser User, DateTimeOffset ExpiresAt);
}
