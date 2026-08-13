using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace JiuDiary.Api.Auth;

/// <summary>
/// Регистрирует авторизацию, JWT и сервисы пользовательских сессий.
/// </summary>
public static class AuthExtensions
{
    /// <summary>
    /// Подключает сервис авторизации и проверку Bearer JWT.
    /// </summary>
    /// <param name="services">Коллекция сервисов приложения.</param>
    /// <param name="configuration">Конфигурация приложения.</param>
    /// <returns>Та же коллекция сервисов для последовательной настройки.</returns>
    public static IServiceCollection AddJiuDiaryAuth(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Ошибка в ключе или сроках жизни останавливает приложение при запуске, а не при первом входе.
        services
            .AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .Validate(options => options.SigningKey.Length >= 32, "Jwt:SigningKey должен содержать не менее 32 символов.")
            .Validate(options => options.AccessTokenMinutes is > 0 and <= 60, "Jwt:AccessTokenMinutes должен быть в диапазоне от 1 до 60.")
            .Validate(options => options.RefreshTokenDays is > 0 and <= 90, "Jwt:RefreshTokenDays должен быть в диапазоне от 1 до 90.")
            .ValidateOnStart();

        services
            .AddOptions<AuthBootstrapOptions>()
            .Bind(configuration.GetSection(AuthBootstrapOptions.SectionName));

        var jwtOptions = configuration
            .GetSection(JwtOptions.SectionName)
            .Get<JwtOptions>() ?? new JwtOptions();

        // Каждый Bearer-токен проверяется по подписи, издателю, получателю и сроку действия.
        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.MapInboundClaims = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtOptions.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
                    ValidateLifetime = true,
                    // Небольшой допуск компенсирует незначительное расхождение времени серверов.
                    ClockSkew = TimeSpan.FromSeconds(30),
                    NameClaimType = ClaimTypes.Name,
                    RoleClaimType = ClaimTypes.Role
                };
            });
        services.AddAuthorization();
        return services;
    }
}
