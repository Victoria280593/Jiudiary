using System.Security.Claims;

namespace JiuDiary.Api.Auth;

/// <summary>
/// Хранит безопасные идентификаторы и результат проверки авторизации для журналирования HTTP-запроса.
/// </summary>
internal static class AuthenticationLogContext
{
    private const string UserIdKey = "AuthenticationLog.UserId";
    private const string UserLoginKey = "AuthenticationLog.UserLogin";
    private const string StatusKey = "AuthenticationLog.Status";

    public static void Set(HttpContext context, string status, string? userId = null, string? login = null)
    {
        context.Items[StatusKey] = status;

        if (!string.IsNullOrWhiteSpace(userId))
        {
            context.Items[UserIdKey] = userId;
        }

        if (!string.IsNullOrWhiteSpace(login))
        {
            context.Items[UserLoginKey] = login;
        }
    }

    public static AuthenticationLogIdentity Get(HttpContext context)
    {
        var userId = context.User.FindFirstValue("sub")
            ?? context.Items[UserIdKey] as string
            ?? "unknown";
        var login = context.User.FindFirstValue("email")
            ?? context.User.FindFirstValue(ClaimTypes.Email)
            ?? context.User.Identity?.Name
            ?? context.Items[UserLoginKey] as string;
        var status = context.User.Identity?.IsAuthenticated == true
            ? "authenticated"
            : context.Items[StatusKey] as string;

        if (string.IsNullOrWhiteSpace(status) && context.Request.Path.Equals("/api/auth/refresh", StringComparison.OrdinalIgnoreCase))
        {
            status = "refresh-request";
            login ??= "pending-refresh";
        }

        return new AuthenticationLogIdentity(
            userId,
            login ?? "anonymous",
            status ?? "anonymous");
    }
}

internal sealed record AuthenticationLogIdentity(string UserId, string UserLogin, string AuthStatus);
