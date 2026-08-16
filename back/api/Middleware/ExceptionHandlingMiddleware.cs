using JiraDiary.AspCore.Exceptions;

namespace JiuDiary.Api.Middleware;

internal sealed class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger)
{
    private const string InternalServerErrorMessage = "Внутренняя ошибка сервера.";

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            var (statusCode, message) = exception switch
            {
                AspNetException aspNetException =>
                    (aspNetException.StatusCode, aspNetException.Message),
                _ => (StatusCodes.Status500InternalServerError, InternalServerErrorMessage)
            };

            logger.LogError(
                exception,
                "Ошибка HTTP {Method} {Path} | Status: {StatusCode} | Message: {ErrorMessage} | TraceId: {TraceId}",
                context.Request.Method,
                context.Request.Path,
                statusCode,
                exception.Message,
                context.TraceIdentifier);

            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Clear();
            context.Response.StatusCode = statusCode;

            await context.Response.WriteAsJsonAsync(new
            {
                error = message,
                traceId = context.TraceIdentifier
            });
        }
    }
}
