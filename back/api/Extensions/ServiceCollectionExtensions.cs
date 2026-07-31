using JiuDiary.Api.Auth;
using JiuDiary.Api.Services;
using JiuDiary.Database.Entities;
using Microsoft.AspNetCore.Identity;

namespace JiuDiary.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ClientInfoService>();
        services.AddScoped<BranchService>();
        services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();

        return services;
    }
}
