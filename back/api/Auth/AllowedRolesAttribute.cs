using JiuDiary.Database.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace JiuDiary.Api.Auth;

/// <summary>
/// Ограничивает доступ к методу одной или несколькими ролями приложения.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true, Inherited = true)]
public sealed class AllowedRolesAttribute : Attribute, IAuthorizationFilter
{
    private readonly HashSet<UserRolesEnum> allowedRoles;

    public AllowedRolesAttribute(params UserRolesEnum[] roles)
    {
        ArgumentNullException.ThrowIfNull(roles);
        if (roles.Length == 0)
        {
            throw new ArgumentException("Необходимо указать хотя бы одну разрешённую роль.", nameof(roles));
        }

        allowedRoles = roles.ToHashSet();
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        if (!context.HttpContext.Items.TryGetValue(AuthenticatedUserMiddleware.HttpContextItemKey, out var value) ||
            value is not AuthenticatedUser user)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        if (!allowedRoles.Contains(user.Role))
        {
            context.Result = new ForbidResult();
        }
    }
}
