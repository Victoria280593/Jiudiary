using System.Data;
using System.Security.Cryptography;
using System.Text;
using JiuDiary.Database;
using JiuDiary.Database.Entities;
using JiuDiary.Models.Auth;
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
    private const int CoachRoleId = 2;
    private const string CoachRoleName = "Coach";
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;
    private readonly AuthBootstrapOptions _bootstrapOptions = bootstrapOptions.Value;

    /// <summary>
    /// Регистрирует тренера и сохраняет только безопасный хеш его пароля.
    /// </summary>
    public async Task<UserOutputModel?> RegisterAsync(
        string login,
        string name,
        string password,
        CancellationToken cancellationToken)
    {
        var normalizedLogin = login.Trim();

        // Логин уникален: повторная регистрация возвращает Conflict через контроллер.
        if (await dbContext.Users.AnyAsync(
                user => user.Login == normalizedLogin,
                cancellationToken))
        {
            return null;
        }

        // Пока открыта только регистрация тренеров; роль создаётся один раз при необходимости.
        var role = await dbContext.Roles.SingleOrDefaultAsync(
            existingRole => existingRole.Name == CoachRoleName,
            cancellationToken);

        if (role is null)
        {
            role = new Role { Id = CoachRoleId, Name = CoachRoleName };
            dbContext.Roles.Add(role);
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Login = normalizedLogin,
            Name = name.Trim(),
            IsActive = true,
            Role = role,
            RoleId = role.Id
        };

        // Открытый пароль не записывается в БД и после вычисления хеша больше не используется.
        user.PasswordHash = passwordHasher.HashPassword(user, password);

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);

        return ToUserOutputModel(ToAuthenticatedUser(user));
    }

    /// <summary>
    /// Проверяет пароль пользователя и при успехе создаёт JWT-сессию.
    /// </summary>
    public async Task<LoginOutputModel?> LoginAsync(
        string login,
        string password,
        CancellationToken cancellationToken)
    {
        // Роль загружается вместе с пользователем, чтобы поместить её в claims JWT.
        var user = await dbContext.Users
            .Include(x => x.Role)
            .SingleOrDefaultAsync(x => x.Login == login.Trim(), cancellationToken);

        if (user is null || !user.IsActive)
        {
            return null;
        }

        // Bootstrap нужен только для первого входа заранее созданного администратора без хеша.
        if (string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            if (!CanBootstrap(user.Login, password))
            {
                return null;
            }

            user.PasswordHash = passwordHasher.HashPassword(user, password);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        // PasswordHasher сам извлекает salt из PasswordHash и безопасно сравнивает пароль.
        var verification = passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            password);

        return verification == PasswordVerificationResult.Failed
            ? null
            : await CreateSessionAsync(user, cancellationToken);
    }

    /// <summary>
    /// Обменивает действующий refresh-токен на полностью новую пару токенов.
    /// </summary>
    public async Task<LoginOutputModel?> RefreshAsync(
        string refreshToken,
        CancellationToken cancellationToken)
    {
        // В БД ищется SHA-256-хеш: исходный refresh-токен хранится только у клиента.
        var tokenHash = HashToken(refreshToken);

        // Serializable-транзакция не позволяет двум запросам одновременно использовать один токен.
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var session = await dbContext.AuthSessions
            .Include(x => x.User)
            .ThenInclude(x => x.Role)
            .SingleOrDefaultAsync(x => x.RefreshTokenHash == tokenHash, cancellationToken);

        if (session is null ||
            session.RevokedAt is not null ||
            session.ExpiresAt <= DateTime.Now ||
            !session.User.IsActive)
        {
            await transaction.RollbackAsync(cancellationToken);
            return null;
        }

        // Старый refresh-токен становится недействительным сразу после единственного применения.
        session.LastUsedAt = DateTime.Now;
        session.RevokedAt = DateTime.Now;

        // Создаётся новая серверная сессия, новый refresh-токен и новый access JWT.
        var response = await CreateSessionAsync(session.User, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return response;
    }

    /// <summary>
    /// Завершает сессию, помечая соответствующий refresh-токен отозванным.
    /// </summary>
    public async Task LogoutAsync(
        string refreshToken,
        CancellationToken cancellationToken)
    {
        // Клиент присылает исходный токен, а сравнение выполняется по его хешу.
        var tokenHash = HashToken(refreshToken);
        var session = await dbContext.AuthSessions
            .SingleOrDefaultAsync(x => x.RefreshTokenHash == tokenHash, cancellationToken);

        if (session is null || session.RevokedAt is not null)
        {
            return;
        }

        session.RevokedAt = DateTime.Now;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Создаёт access JWT, одноразовый refresh-токен и запись серверной сессии.
    /// </summary>
    private async Task<LoginOutputModel> CreateSessionAsync(
        User user,
        CancellationToken cancellationToken)
    {
        // Access-токен короткий, refresh-сессия живёт дольше и позволяет выпустить новую пару.
        var refreshToken = CreateRefreshToken();
        var refreshExpiresAt = DateTimeOffset.Now.AddDays(_jwtOptions.RefreshTokenDays);
        var authenticatedUser = ToAuthenticatedUser(user);

        dbContext.AuthSessions.Add(new AuthSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RefreshTokenHash = HashToken(refreshToken),
            ExpiresAt = refreshExpiresAt.DateTime,
            CreatedAt = DateTime.Now
        });

        // В MSSQL сохраняется только хеш refresh-токена: украденная БД не раскрывает сам токен.
        await dbContext.SaveChangesAsync(cancellationToken);

        // Access JWT не хранится на сервере: его подлинность подтверждается HMAC-подписью.
        var accessToken = jwtTokenService.Issue(authenticatedUser);

        // Исходный refresh-токен возвращается клиенту единственный раз.
        return new LoginOutputModel
        {
            AccessToken = accessToken.Token,
            TokenType = "Bearer",
            ExpiresAt = accessToken.ExpiresAt,
            RefreshToken = refreshToken,
            RefreshExpiresAt = refreshExpiresAt,
            User = ToUserOutputModel(authenticatedUser)
        };
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
    /// Преобразует внутреннюю модель пользователя в DTO ответа API.
    /// </summary>
    private static UserOutputModel ToUserOutputModel(AuthenticatedUser user) =>
        new()
        {
            Id = user.Id,
            Login = user.Login,
            Name = user.Name,
            Role = user.Role
        };

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
