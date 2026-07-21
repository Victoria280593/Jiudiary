namespace JiuDiary.Api.Contracts.Auth;

public sealed record LoginResponse(
    string AccessToken,
    string TokenType,
    DateTimeOffset ExpiresAt,
    UserResponse User);
