using System.Net;

namespace JiraDiary.AspCore.Exceptions;

/// <summary>
/// Исключение с безопасным сообщением для клиента и соответствующим HTTP-статусом.
/// </summary>
public sealed class AspNetException : Exception
{
    public AspNetException(string message, int statusCode)
        : base(message)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(message);
        ValidateStatusCode(statusCode);

        StatusCode = statusCode;
    }

    public AspNetException(string message, HttpStatusCode statusCode)
        : this(message, (int)statusCode)
    {
    }

    public AspNetException(string message, int statusCode, Exception innerException)
        : base(message, innerException)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(message);
        ValidateStatusCode(statusCode);

        StatusCode = statusCode;
    }

    public int StatusCode { get; }

    private static void ValidateStatusCode(int statusCode)
    {
        if (statusCode is < 400 or > 599)
        {
            throw new ArgumentOutOfRangeException(
                nameof(statusCode),
                statusCode,
                "Код состояния исключения должен находиться в диапазоне от 400 до 599.");
        }
    }
}
