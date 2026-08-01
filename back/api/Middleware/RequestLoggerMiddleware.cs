using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace JiuDiary.Api.Middleware;

internal sealed class RequestLoggerMiddleware(RequestDelegate next)
{
    private readonly RequestDelegate _next = next ?? throw new ArgumentNullException(nameof(next));

    public async Task InvokeAsync(HttpContext context, ILogger<RequestLoggerMiddleware> logger)
    {
        var stopwatch = Stopwatch.StartNew();
        var login = GetLogin(context);
        var requestSize = context.Request.ContentLength ?? 0;
        Exception? requestException = null;

        using var scope = logger.BeginScope(new Dictionary<string, object>
        {
            ["UserLogin"] = login
        });

        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            requestException = exception;
            throw;
        }
        finally
        {
            stopwatch.Stop();
            var statusCode = requestException is null
                ? context.Response.StatusCode
                : StatusCodes.Status500InternalServerError;

            if (requestException is null)
            {
                logger.LogInformation(
                    "HTTP {Method} {Path} завершён Status: {StatusCode} Request Size: {RequestSizeBytes} bytes Time: {Elapsed}",
                    context.Request.Method,
                    context.Request.Path,
                    statusCode,
                    requestSize,
                    stopwatch.Elapsed);
            }
            else
            {
                logger.LogError(
                    requestException,
                    "HTTP {Method} {Path} завершён с ошибкой Status: {StatusCode} Request Size: {RequestSizeBytes} bytes Time: {Elapsed}",
                    context.Request.Method,
                    context.Request.Path,
                    statusCode,
                    requestSize,
                    stopwatch.Elapsed);
            }
        }
    }

    private static string GetLogin(HttpContext context) =>
        context.User.FindFirstValue(JwtRegisteredClaimNames.Email)
        ?? context.User.FindFirstValue(ClaimTypes.Email)
        ?? context.User.Identity?.Name
        ?? "anonymous";
}
