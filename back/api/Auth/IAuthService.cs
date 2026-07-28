using JiuDiary.Models.Auth;

namespace JiuDiary.Api.Auth;

public interface IAuthService
{
    Task<UserOutputModel?> RegisterAsync(RegisterInputModel inputModel, CancellationToken cancellationToken);

    Task<LoginOutputModel?> LoginAsync(LoginInputModel inputModel, CancellationToken cancellationToken);

    Task<LoginOutputModel?> RefreshAsync(RefreshInputModel inputModel, CancellationToken cancellationToken);

    Task LogoutAsync(LogoutInputModel inputModel, CancellationToken cancellationToken);
}
