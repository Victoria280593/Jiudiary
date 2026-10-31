using JiuDiary.Admin.Services;

namespace JiuDiary.Admin.Middleware;

public sealed class AdminAuditMiddleware(RequestDelegate next, ILogger<AdminAuditMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context, AdminAuditService auditService)
    {
        await next(context);

        if (context.User.Identity?.IsAuthenticated != true ||
            context.Request.Path.StartsWithSegments("/css"))
        {
            return;
        }

        try
        {
            var method = context.Request.Method;
            await auditService.WriteAsync(
                context.User.Identity.Name ?? "unknown",
                method == HttpMethods.Get ? "Открытие" : "Действие",
                method,
                context.Request.Path,
                context.Response.StatusCode,
                null,
                context.Connection.RemoteIpAddress?.ToString());
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Не удалось записать событие аудита админки");
        }
    }
}
