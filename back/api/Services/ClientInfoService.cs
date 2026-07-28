using JiuDiary.Database;
using JiuDiary.Database.Entities;
using JiuDiary.Models.ClientInfo;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.Services;

public sealed class ClientInfoService(JiuDiaryDbContext dbContext) : IClientInfoService
{
    public async Task<ClientInfoOutputModel> GetAsync(Guid userId, CancellationToken cancellationToken)
    {
        var clientInfo = await dbContext.ClientInfos
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(ToOutputModelExpression())
            .ToListAsync(cancellationToken);

        return clientInfo.SingleOrDefault() ?? new ClientInfoOutputModel();
    }

    public async Task<ClientInfoOutputModel?> UpdateAsync(Guid userId, UpdateClientInfoInputModel inputModel, CancellationToken cancellationToken)
    {
        if (!await dbContext.Users.AnyAsync(x => x.Id == userId, cancellationToken))
        {
            return null;
        }

        if (inputModel.BeltId.HasValue &&
            !await dbContext.Belts.AnyAsync(x => x.Id == inputModel.BeltId.Value, cancellationToken))
        {
            throw new ArgumentException("The selected belt does not exist.", nameof(inputModel.BeltId));
        }

        var clientInfo = await dbContext.ClientInfos
            .SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (clientInfo is null)
        {
            clientInfo = new ClientInfo { UserId = userId };
            dbContext.ClientInfos.Add(clientInfo);
        }

        clientInfo.Country = Normalize(inputModel.Country);
        clientInfo.BirthDate = inputModel.BirthDate;
        clientInfo.BeltId = inputModel.BeltId;
        clientInfo.StripesCount = inputModel.StripesCount;

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetAsync(userId, cancellationToken);
    }

    private static System.Linq.Expressions.Expression<Func<ClientInfo, ClientInfoOutputModel>> ToOutputModelExpression() =>
        clientInfo => new ClientInfoOutputModel
        {
            Country = clientInfo.Country,
            BirthDate = clientInfo.BirthDate,
            BeltId = clientInfo.BeltId,
            BeltName = clientInfo.Belt == null ? null : clientInfo.Belt.Name,
            StripesCount = clientInfo.StripesCount
        };

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
