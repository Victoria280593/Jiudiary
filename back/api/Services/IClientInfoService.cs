using JiuDiary.Models.ClientInfo;

namespace JiuDiary.Api.Services;

public interface IClientInfoService
{
    Task<ClientInfoOutputModel> GetAsync(Guid userId, CancellationToken cancellationToken);

    Task<ClientInfoOutputModel?> UpdateAsync(Guid userId, UpdateClientInfoInputModel inputModel, CancellationToken cancellationToken);
}
