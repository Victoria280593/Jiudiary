using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace JiuDiary.Api.Middleware;

internal sealed class RequestLoggerMiddleware(RequestDelegate next)
{
    private readonly RequestDelegate _next = next ?? throw new ArgumentNullException(nameof(next));

    public async Task InvokeAsync(HttpContext context, ILogger<RequestLoggerMiddleware> logger)
    {
        var login = GetLogin(context);
        var requestSize = context.Request.ContentLength ?? 0;
        var originalResponseBody = context.Response.Body;
        var responseSizeStream = new ResponseSizeStream(originalResponseBody);
        Exception? requestException = null;

        using var scope = logger.BeginScope(new Dictionary<string, object>
        {
            ["UserLogin"] = login
        });

        logger.LogInformation(
            "Start HTTP {Method} {Path}; Request Size: {RequestSizeBytes} bytes",
            context.Request.Method,
            context.Request.Path,
            requestSize);

        var stopwatch = Stopwatch.StartNew();
        context.Response.Body = responseSizeStream;

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
            context.Response.Body = originalResponseBody;

            var statusCode = requestException is null
                ? context.Response.StatusCode
                : StatusCodes.Status500InternalServerError;

            if (requestException is null)
            {
                logger.LogInformation(
                    "End HTTP {Method} {Path}; Status: {StatusCode}; Response Size: {ResponseSizeBytes} bytes; Time: {Elapsed}",
                    context.Request.Method,
                    context.Request.Path,
                    statusCode,
                    responseSizeStream.BytesWritten,
                    stopwatch.Elapsed);
            }
            else
            {
                logger.LogError(
                    requestException,
                    "End HTTP {Method} {Path} с ошибкой; Status: {StatusCode}; Response Size: {ResponseSizeBytes} bytes; Time: {Elapsed}",
                    context.Request.Method,
                    context.Request.Path,
                    statusCode,
                    responseSizeStream.BytesWritten,
                    stopwatch.Elapsed);
            }
        }
    }

    private static string GetLogin(HttpContext context) =>
        context.User.FindFirstValue(JwtRegisteredClaimNames.Email)
        ?? context.User.FindFirstValue(ClaimTypes.Email)
        ?? context.User.Identity?.Name
        ?? "anonymous";

    private sealed class ResponseSizeStream(Stream innerStream) : Stream
    {
        public long BytesWritten { get; private set; }

        public override bool CanRead => innerStream.CanRead;
        public override bool CanSeek => innerStream.CanSeek;
        public override bool CanWrite => innerStream.CanWrite;
        public override long Length => innerStream.Length;

        public override long Position
        {
            get => innerStream.Position;
            set => innerStream.Position = value;
        }

        public override void Flush() => innerStream.Flush();
        public override Task FlushAsync(CancellationToken cancellationToken) => innerStream.FlushAsync(cancellationToken);
        public override int Read(byte[] buffer, int offset, int count) => innerStream.Read(buffer, offset, count);
        public override long Seek(long offset, SeekOrigin origin) => innerStream.Seek(offset, origin);
        public override void SetLength(long value) => innerStream.SetLength(value);

        public override void Write(byte[] buffer, int offset, int count)
        {
            innerStream.Write(buffer, offset, count);
            BytesWritten += count;
        }

        public override void Write(ReadOnlySpan<byte> buffer)
        {
            innerStream.Write(buffer);
            BytesWritten += buffer.Length;
        }

        public override void WriteByte(byte value)
        {
            innerStream.WriteByte(value);
            BytesWritten++;
        }

        public override async Task WriteAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken)
        {
            await innerStream.WriteAsync(buffer.AsMemory(offset, count), cancellationToken);
            BytesWritten += count;
        }

        public override async ValueTask WriteAsync(ReadOnlyMemory<byte> buffer, CancellationToken cancellationToken = default)
        {
            await innerStream.WriteAsync(buffer, cancellationToken);
            BytesWritten += buffer.Length;
        }
    }
}
