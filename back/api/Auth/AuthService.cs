using System.Data;
using System.Security.Cryptography;
using System.Text;
using JiuDiary.Database;
using JiuDiary.Database.Entities;
using JiuDiary.Database.Enums;
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
    IOptions<AuthBootstrapOptions> bootstrapOptions,
    ILogger<AuthService> logger) : IAuthService
{
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;
    private readonly AuthBootstrapOptions _bootstrapOptions = bootstrapOptions.Value;

    /// <summary>
    /// Регистрирует тренера и сохраняет только безопасный хеш его пароля.
    /// </summary>
    public async Task<UserOutputModel?> RegisterAsync(RegisterInputModel inputModel, CancellationToken cancellationToken)
    {
        logger.LogInformation("Начата регистрация пользователя");
        var normalizedLogin = inputModel.Login?.Trim() ?? string.Empty;

        // Логин уникален: повторная регистрация возвращает Conflict через контроллер.
        if (await dbContext.Users.AnyAsync(
                user => user.Login == normalizedLogin && user.RoleId == (int)inputModel.Role,
                cancellationToken))
        {
            logger.LogInformation("Регистрация пользователя не выполнена: логин уже зарегистрирован");
            return null;
        }

        var requestedRole = inputModel.Role;
        var requestedRoleName = requestedRole.ToString();

        var role = await dbContext.Roles.SingleOrDefaultAsync(
            existingRole => existingRole.Id == (int)requestedRole && existingRole.Name == requestedRoleName,
            cancellationToken);

        if (role is null)
        {
            throw new InvalidOperationException($"В базе данных не найдена роль {requestedRoleName} с идентификатором {(int)requestedRole}.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Login = normalizedLogin,
            FirstName = inputModel.FirstName?.Trim() ?? string.Empty,
            LastName = inputModel.LastName?.Trim() ?? string.Empty,
            MiddleName = string.IsNullOrWhiteSpace(inputModel.MiddleName) ? null : inputModel.MiddleName.Trim(),
            IsActive = true,
            Role = role,
            RoleId = role.Id
        };

        // Открытый пароль не записывается в БД и после вычисления хеша больше не используется.
        user.PasswordHash = passwordHasher.HashPassword(user, inputModel.Password!);

        dbContext.Users.Add(user);
        dbContext.ClientInfos.Add(new ClientInfo
        {
            UserId = user.Id,
            BirthDate = null,
            BeltId = null
        });
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Пользователь зарегистрирован. UserId: {UserId} | RoleId: {RoleId}", user.Id, user.RoleId);
        return ToUserOutputModel(ToAuthenticatedUser(user));
    }

    /// <summary>
    /// Проверяет пароль пользователя и при успехе создаёт JWT-сессию.
    /// </summary>
    public async Task<LoginOutputModel?> LoginAsync(LoginInputModel inputModel, CancellationToken cancellationToken)
    {
        logger.LogInformation("Начата авторизация пользователя");

        // Роль загружается вместе с пользователем, чтобы поместить её в claims JWT.
        var normalizedLogin = inputModel.Login ?? string.Empty;
        var user = await dbContext.Users
            .Include(x => x.Role)
            .SingleOrDefaultAsync(
                x => x.Login == normalizedLogin.Trim() &&
                     (x.RoleId == (int)inputModel.Role || x.RoleId == (int)UserRolesEnum.Admin),
                cancellationToken);

        if (user is null || !user.IsActive)
        {
            logger.LogInformation("Авторизация пользователя не выполнена");
            return null;
        }

        // Bootstrap нужен только для первого входа заранее созданного администратора без хеша.
        if (string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            if (!CanBootstrap(user.Login, inputModel.Password!))
            {
                logger.LogInformation("Авторизация пользователя не выполнена. UserId: {UserId}", user.Id);
                return null;
            }

            user.PasswordHash = passwordHasher.HashPassword(user, inputModel.Password!);
            await dbContext.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Для пользователя создан первоначальный хеш пароля. UserId: {UserId}", user.Id);
        }

        // PasswordHasher сам извлекает salt из PasswordHash и безопасно сравнивает пароль.
        var verification = passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            inputModel.Password!);

        if (verification == PasswordVerificationResult.Failed)
        {
            logger.LogInformation("Авторизация пользователя не выполнена. UserId: {UserId}", user.Id);
            return null;
        }

        var result = await CreateSessionAsync(user, cancellationToken);
        logger.LogInformation("Пользователь авторизован. UserId: {UserId}", user.Id);
        return result;
    }

    /// <summary>
    /// Обменивает действующий refresh-токен на полностью новую пару токенов.
    /// </summary>
    public async Task<LoginOutputModel?> RefreshAsync(RefreshInputModel inputModel, CancellationToken cancellationToken)
    {
        logger.LogInformation("Начато обновление сессии авторизации");

        // В БД ищется SHA-256-хеш: исходный refresh-токен хранится только у клиента.
        var tokenHash = HashToken(inputModel.RefreshToken!);

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
            logger.LogInformation("Сессия авторизации не обновлена");
            return null;
        }

        // Старый refresh-токен становится недействительным сразу после единственного применения.
        session.LastUsedAt = DateTime.Now;
        session.RevokedAt = DateTime.Now;

        // Создаётся новая серверная сессия, новый refresh-токен и новый access JWT.
        var response = await CreateSessionAsync(session.User, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        logger.LogInformation("Сессия авторизации обновлена. UserId: {UserId}", session.UserId);
        return response;
    }

    /// <summary>
    /// Завершает сессию, помечая соответствующий refresh-токен отозванным.
    /// </summary>
    public async Task LogoutAsync(LogoutInputModel inputModel, CancellationToken cancellationToken)
    {
        logger.LogInformation("Начато завершение сессии авторизации");

        // Клиент присылает исходный токен, а сравнение выполняется по его хешу.
        var tokenHash = HashToken(inputModel.RefreshToken!);
        var session = await dbContext.AuthSessions
            .SingleOrDefaultAsync(x => x.RefreshTokenHash == tokenHash, cancellationToken);

        if (session is null || session.RevokedAt is not null)
        {
            logger.LogInformation("Активная сессия для завершения не найдена");
            return;
        }

        session.RevokedAt = DateTime.Now;
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Сессия авторизации завершена. UserId: {UserId} | SessionId: {SessionId}", session.UserId, session.Id);
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
            user.Id,
            user.Login,
            GetFullName(user.FirstName, user.LastName, user.MiddleName),
            (UserRolesEnum)user.RoleId);

    /// <summary>
    /// Собирает отображаемое ФИО пользователя.
    /// </summary>
    private static string GetFullName(string firstName, string lastName, string? middleName) =>
        string.Join(" ", new[] { lastName, firstName, middleName }.Where(value => !string.IsNullOrWhiteSpace(value)));

    /// <summary>
    /// Преобразует внутреннюю модель пользователя в DTO ответа API.
    /// </summary>
    private static UserOutputModel ToUserOutputModel(AuthenticatedUser user) =>
        new()
        {
            Id = user.Id.ToString(),
            Login = user.Login,
            Name = user.Name,
            Role = user.Role.ToString().ToUpperInvariant()
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
