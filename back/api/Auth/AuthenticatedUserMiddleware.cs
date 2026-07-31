using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using JiuDiary.Database;
using JiuDiary.Database.Enums;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.Auth;

public sealed class AuthenticatedUserMiddleware(RequestDelegate next)
{
    public const string HttpContextItemKey = nameof(AuthenticatedUser);

    public async Task InvokeAsync(HttpContext context, JiuDiaryDbContext dbContext)
    {
        if (context.User.Identity?.IsAuthenticated != true)
        {
            await next(context);
            return;
        }

        var idClaim = context.User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(idClaim, out var userId))
        {
            await WriteUnauthorizedAsync(context, "JWT-токен не содержит корректный идентификатор пользователя.");
            return;
        }

        var user = await dbContext.Users
            .AsNoTracking()
            .Where(x => x.Id == userId && x.IsActive)
            .Select(x => new AuthenticatedUser(x.Id, x.Login, x.Name, (UserRolesEnum)x.RoleId))
            .SingleOrDefaultAsync(context.RequestAborted);

        if (user is null || !Enum.IsDefined(user.Role))
        {
            await WriteUnauthorizedAsync(context, "Пользователь не найден, заблокирован или имеет неизвестную роль.");
            return;
        }

        context.Items[HttpContextItemKey] = user;
        await next(context);
    }

    private static async Task WriteUnauthorizedAsync(HttpContext context, string error)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        await context.Response.WriteAsJsonAsync(new { error }, context.RequestAborted);
    }
}
