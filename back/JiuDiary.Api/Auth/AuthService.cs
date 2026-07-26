using System.Data;
using System.Security.Cryptography;
using System.Text;
using JiuDiary.Api.Contracts.Auth;
using JiuDiary.Api.DataBase;
using JiuDiary.Api.DataBase.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace JiuDiary.Api.Auth;

/// <summary>
/// Реализует авторизацию через MSSQL, JWT и серверные refresh-сессии.
/// </summary>
public sealed class AuthService(
    JiuDiaryDbContext dbContext,
    IPasswordHasher<User> passwordHasher,
    IJwtTokenService jwtTokenService,
    IOptions<JwtOptions> jwtOptions,
    IOptions<AuthBootstrapOptions> bootstrapOptions) : IAuthService
{
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;
    private readonly AuthBootstrapOptions _bootstrapOptions = bootstrapOptions.Value;

    /// <inheritdoc />
    public async Task<LoginResponse?> LoginAsync(
        string login,
        string password,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Include(x => x.Role)
            .SingleOrDefaultAsync(x => x.Login == login.Trim(), cancellationToken);

        if (user is null || !user.IsActive)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            if (!CanBootstrap(user.Login, password))
            {
                return null;
            }

            user.PasswordHash = passwordHasher.HashPassword(user, password);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var verification = passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            password);

        return verification == PasswordVerificationResult.Failed
            ? null
            : await CreateSessionAsync(user, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<LoginResponse?> RefreshAsync(
        string refreshToken,
        CancellationToken cancellationToken)
    {
        var tokenHash = HashToken(refreshToken);
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var session = await dbContext.AuthSessions
            .Include(x => x.User)
            .ThenInclude(x => x.Role)
            .SingleOrDefaultAsync(x => x.RefreshTokenHash == tokenHash, cancellationToken);

        if (session is null ||
            session.RevokedAt is not null ||
            session.ExpiresAt <= DateTime.UtcNow ||
            !session.User.IsActive)
        {
            await transaction.RollbackAsync(cancellationToken);
            return null;
        }

        session.LastUsedAt = DateTime.UtcNow;
        session.RevokedAt = DateTime.UtcNow;
        var response = await CreateSessionAsync(session.User, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return response;
    }

    /// <inheritdoc />
    public async Task LogoutAsync(
        string refreshToken,
        CancellationToken cancellationToken)
    {
        var tokenHash = HashToken(refreshToken);
        var session = await dbContext.AuthSessions
            .SingleOrDefaultAsync(x => x.RefreshTokenHash == tokenHash, cancellationToken);

        if (session is null || session.RevokedAt is not null)
        {
            return;
        }

        session.RevokedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Создаёт JWT, refresh-токен и запись серверной сессии.
    /// </summary>
    private async Task<LoginResponse> CreateSessionAsync(
        User user,
        CancellationToken cancellationToken)
    {
        var refreshToken = CreateRefreshToken();
        var refreshExpiresAt = DateTimeOffset.UtcNow.AddDays(_jwtOptions.RefreshTokenDays);
        var authenticatedUser = ToAuthenticatedUser(user);

        dbContext.AuthSessions.Add(new AuthSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RefreshTokenHash = HashToken(refreshToken),
            ExpiresAt = refreshExpiresAt.UtcDateTime,
            CreatedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync(cancellationToken);

        var accessToken = jwtTokenService.Issue(authenticatedUser);
        return new LoginResponse(
            accessToken.Token,
            "Bearer",
            accessToken.ExpiresAt,
            refreshToken,
            refreshExpiresAt,
            UserResponse.From(authenticatedUser));
    }

    /// <summary>
    /// Разрешает один раз записать хеш пароля существующего администратора.
    /// </summary>
    private bool CanBootstrap(string login, string password) =>
        _bootstrapOptions.Enabled &&
        FixedTimeEquals(_bootstrapOptions.Login.Trim(), login.Trim()) &&
        FixedTimeEquals(_bootstrapOptions.Password, password);

    /// <summary>
    /// Преобразует сущность базы в безопасную модель авторизованного пользователя.
    /// </summary>
    private static AuthenticatedUser ToAuthenticatedUser(User user) =>
        new(
            user.Id.ToString(),
            user.Login,
            user.Name,
            user.Role.Name.ToUpperInvariant());

    /// <summary>
    /// Создаёт криптографически стойкий одноразовый refresh-токен.
    /// </summary>
    private static string CreateRefreshToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(48))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

    /// <summary>
    /// Получает фиксированный SHA-256-хеш токена для хранения и поиска в базе.
    /// </summary>
    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    /// <summary>
    /// Сравнивает секреты без утечки времени сравнения.
    /// </summary>
    private static bool FixedTimeEquals(string expected, string actual)
    {
        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        var actualBytes = Encoding.UTF8.GetBytes(actual);
        return expectedBytes.Length == actualBytes.Length &&
               CryptographicOperations.FixedTimeEquals(expectedBytes, actualBytes);
    }
}
