using System.Security.Claims;
using System.Threading.RateLimiting;
using JiuDiary.Api.Auth;
using JiuDiary.Api.Contracts.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddOptions<TemporaryAuthOptions>()
    .Bind(builder.Configuration.GetSection(TemporaryAuthOptions.SectionName))
    .Validate(options => !string.IsNullOrWhiteSpace(options.Login), "TemporaryAuth:Login is required")
    .Validate(options => !string.IsNullOrWhiteSpace(options.Password), "TemporaryAuth:Password is required")
    .ValidateOnStart();

builder.Services.AddSingleton<IUserAuthenticator, HardcodedUserAuthenticator>();
builder.Services.AddSingleton<ITokenStore, InMemoryTokenStore>();

builder.Services
    .AddAuthentication(BearerTokenAuthenticationHandler.SchemeName)
    .AddScheme<AuthenticationSchemeOptions, BearerTokenAuthenticationHandler>(
        BearerTokenAuthenticationHandler.SchemeName,
        _ => { });
builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "JiuDiary API",
        Version = "v1",
        Description = "API авторизации и данных спортивного дневника."
    });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "opaque token",
        Description = "Вставьте accessToken, полученный через POST /api/auth/login."
    });
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document, null)] = []
    });
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("login", limiter =>
    {
        limiter.PermitLimit = 10;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.QueueLimit = 0;
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "JiuDiary API v1");
    options.DocumentTitle = "JiuDiary API";
});

app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Redirect("/swagger"))
    .ExcludeFromDescription();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }))
    .WithName("HealthCheck")
    .WithSummary("Проверить доступность API")
    .WithTags("System");

app.MapPost("/api/auth/login", (
        LoginRequest request,
        IUserAuthenticator authenticator,
        ITokenStore tokenStore) =>
    {
        if (string.IsNullOrWhiteSpace(request.Login) || string.IsNullOrEmpty(request.Password))
        {
            return Results.BadRequest(new { error = "Login and password are required." });
        }

        var user = authenticator.Authenticate(request.Login, request.Password);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        var session = tokenStore.Issue(user);
        return Results.Ok(new LoginResponse(
            session.Token,
            "Bearer",
            session.ExpiresAt,
            UserResponse.From(user)));
    })
    .RequireRateLimiting("login")
    .WithName("Login")
    .WithSummary("Войти и получить bearer-токен")
    .WithTags("Auth");

app.MapGet("/api/auth/me", (ClaimsPrincipal principal) =>
    Results.Ok(new UserResponse(
        principal.FindFirstValue(ClaimTypes.NameIdentifier)!,
        principal.FindFirstValue(ClaimTypes.Email)!,
        principal.FindFirstValue(ClaimTypes.Name)!,
        principal.FindFirstValue(ClaimTypes.Role)!)))
    .RequireAuthorization()
    .WithName("GetCurrentUser")
    .WithSummary("Получить текущего пользователя")
    .WithTags("Auth");

app.MapPost("/api/auth/logout", (HttpRequest request, ITokenStore tokenStore) =>
    {
        var token = BearerTokenAuthenticationHandler.ReadToken(request);
        if (token is not null)
        {
            tokenStore.Revoke(token);
        }

        return Results.NoContent();
    })
    .RequireAuthorization()
    .WithName("Logout")
    .WithSummary("Завершить текущую сессию")
    .WithTags("Auth");

app.Run();

public partial class Program;
