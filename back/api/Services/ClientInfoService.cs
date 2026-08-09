using JiuDiary.Database;
using JiuDiary.Database.Entities;
using JiuDiary.Models.ClientInfo;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.Services;

public sealed class ClientInfoService(JiuDiaryDbContext dbContext, ILogger<ClientInfoService> logger)
{
    public async Task<ClientInfoOutputModel> GetAsync(Guid userId, CancellationToken cancellationToken)
    {
        logger.LogInformation("Получение информации клиента. UserId: {UserId}", userId);

        var clientInfo = await dbContext.ClientInfos
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(ToOutputModelExpression())
            .ToListAsync(cancellationToken);

        logger.LogInformation("Информация клиента получена. UserId: {UserId} | Found: {Found}", userId, clientInfo.Count > 0);
        return clientInfo.SingleOrDefault() ?? new ClientInfoOutputModel();
    }

    public async Task<ClientInfoOutputModel?> UpdateAsync(Guid userId, UpdateClientInfoInputModel inputModel, CancellationToken cancellationToken)
    {
        logger.LogInformation("Обновление информации клиента. UserId: {UserId}", userId);

        if (!await dbContext.Users.AnyAsync(x => x.Id == userId, cancellationToken))
        {
            logger.LogInformation("Информация клиента не обновлена: пользователь не найден. UserId: {UserId}", userId);
            return null;
        }

        if (string.IsNullOrWhiteSpace(inputModel.FirstName) || inputModel.FirstName.Trim().Length > 200)
        {
            throw new ArgumentException("Имя обязательно и должно содержать не более 200 символов.", nameof(inputModel.FirstName));
        }

        if (string.IsNullOrWhiteSpace(inputModel.LastName) || inputModel.LastName.Trim().Length > 200)
        {
            throw new ArgumentException("Фамилия обязательна и должна содержать не более 200 символов.", nameof(inputModel.LastName));
        }

        if (inputModel.MiddleName?.Trim().Length > 200)
        {
            throw new ArgumentException("Отчество должно содержать не более 200 символов.", nameof(inputModel.MiddleName));
        }

        if (inputModel.BeltId.HasValue &&
            !await dbContext.Belts.AnyAsync(x => x.Id == inputModel.BeltId.Value, cancellationToken))
        {
            throw new ArgumentException("Выбранный пояс не существует.", nameof(inputModel.BeltId));
        }

        var clientInfo = await dbContext.ClientInfos
            .SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (clientInfo is null)
        {
            clientInfo = new ClientInfo { UserId = userId };
            dbContext.ClientInfos.Add(clientInfo);
        }

        clientInfo.FirstName = inputModel.FirstName.Trim();
        clientInfo.LastName = inputModel.LastName.Trim();
        clientInfo.MiddleName = string.IsNullOrWhiteSpace(inputModel.MiddleName) ? null : inputModel.MiddleName.Trim();
        clientInfo.BirthDate = inputModel.BirthDate;
        clientInfo.BeltId = inputModel.BeltId;

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Информация клиента обновлена. UserId: {UserId}", userId);
        return await GetAsync(userId, cancellationToken);
    }

    private static System.Linq.Expressions.Expression<Func<ClientInfo, ClientInfoOutputModel>> ToOutputModelExpression() =>
        clientInfo => new ClientInfoOutputModel
        {
            FirstName = clientInfo.FirstName,
            LastName = clientInfo.LastName,
            MiddleName = clientInfo.MiddleName,
            BirthDate = clientInfo.BirthDate,
            BeltId = clientInfo.BeltId,
            BeltName = clientInfo.Belt == null ? null : clientInfo.Belt.Name
        };

}
