using JiuDiary.Api.Auth;
using JiuDiary.Database;
using JiuDiary.Database.Entities;
using JiuDiary.Database.Enums;
using JiuDiary.Models.ClientBelt;
using JiraDiary.AspCore.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.Services;

public sealed class ClientBeltService(JiuDiaryDbContext dbContext, ILogger<ClientBeltService> logger)
{
    public async Task<List<ClientBeltOutputModel>> GetAsync(
        Guid clientInfoId,
        AuthenticatedUser user,
        CancellationToken cancellationToken)
    {
        await EnsureAccessAsync(clientInfoId, user, cancellationToken);

        var clientBelts = await dbContext.ClientBelts
            .AsNoTracking()
            .Where(clientBelt => clientBelt.ClientInfoId == clientInfoId)
            .OrderByDescending(clientBelt => clientBelt.ReceivedDate)
            .ThenByDescending(clientBelt => clientBelt.BeltId)
            .Select(ToOutputModel())
            .ToListAsync(cancellationToken);

        logger.LogInformation(
            "История поясов клиента получена. ClientInfoId: {ClientInfoId} | Count: {Count}",
            clientInfoId,
            clientBelts.Count);

        return clientBelts;
    }

    public async Task<ClientBeltOutputModel> CreateAsync(
        Guid clientInfoId,
        SaveClientBeltInputModel inputModel,
        AuthenticatedUser user,
        CancellationToken cancellationToken)
    {
        await EnsureAccessAsync(clientInfoId, user, cancellationToken);
        ValidateStoredBelt(inputModel);
        await EnsureBeltExistsAsync(inputModel.BeltId, cancellationToken);

        if (await dbContext.ClientBelts.AnyAsync(
                item => item.ClientInfoId == clientInfoId && item.BeltId == inputModel.BeltId,
                cancellationToken))
        {
            throw new AspNetException(
                "Пояс этого цвета уже добавлен в историю клиента.",
                StatusCodes.Status409Conflict);
        }

        var clientBelt = new ClientBelt
        {
            ClientInfoId = clientInfoId,
            BeltId = inputModel.BeltId,
            ReceivedDate = inputModel.ReceivedDate,
            StripesCount = inputModel.StripesCount
        };

        dbContext.ClientBelts.Add(clientBelt);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Пояс добавлен в историю клиента. ClientInfoId: {ClientInfoId} | BeltId: {BeltId}",
            clientInfoId,
            inputModel.BeltId);

        return await GetByIdAsync(clientInfoId, clientBelt.Id, cancellationToken);
    }

    public async Task<ClientBeltOutputModel> UpdateAsync(
        Guid clientInfoId,
        Guid clientBeltId,
        SaveClientBeltInputModel inputModel,
        AuthenticatedUser user,
        CancellationToken cancellationToken)
    {
        await EnsureAccessAsync(clientInfoId, user, cancellationToken);
        ValidateStoredBelt(inputModel);
        await EnsureBeltExistsAsync(inputModel.BeltId, cancellationToken);

        var clientBelt = await dbContext.ClientBelts.SingleOrDefaultAsync(
            item => item.Id == clientBeltId && item.ClientInfoId == clientInfoId,
            cancellationToken);

        if (clientBelt is null)
        {
            throw new AspNetException("Запись о поясе не найдена.", StatusCodes.Status404NotFound);
        }

        if (await dbContext.ClientBelts.AnyAsync(
                item => item.ClientInfoId == clientInfoId &&
                        item.BeltId == inputModel.BeltId &&
                        item.Id != clientBeltId,
                cancellationToken))
        {
            throw new AspNetException(
                "Пояс этого цвета уже добавлен в историю клиента.",
                StatusCodes.Status409Conflict);
        }

        clientBelt.BeltId = inputModel.BeltId;
        clientBelt.ReceivedDate = inputModel.ReceivedDate;
        clientBelt.StripesCount = inputModel.StripesCount;

        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Запись о поясе изменена. ClientInfoId: {ClientInfoId} | ClientBeltId: {ClientBeltId}",
            clientInfoId,
            clientBeltId);

        return await GetByIdAsync(clientInfoId, clientBeltId, cancellationToken);
    }

    public async Task<CurrentBeltOutputModel> ChangeCurrentAsync(
        Guid clientInfoId,
        ChangeCurrentBeltInputModel inputModel,
        AuthenticatedUser user,
        CancellationToken cancellationToken)
    {
        var clientInfo = await GetClientInfoAsync(clientInfoId, cancellationToken);
        EnsureAccess(clientInfo, user);

        Belt? belt = null;
        if (inputModel.BeltId.HasValue)
        {
            belt = await dbContext.Belts.SingleOrDefaultAsync(
                item => item.Id == inputModel.BeltId.Value,
                cancellationToken);

            if (belt is null)
            {
                throw new AspNetException("Выбранный пояс не существует.", StatusCodes.Status400BadRequest);
            }
        }

        clientInfo!.BeltId = inputModel.BeltId;
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Текущий пояс клиента изменён. ClientInfoId: {ClientInfoId} | BeltId: {BeltId}",
            clientInfoId,
            inputModel.BeltId);

        return new CurrentBeltOutputModel
        {
            BeltId = belt?.Id,
            BeltName = belt?.Name
        };
    }

    private async Task<ClientBeltOutputModel> GetByIdAsync(
        Guid clientInfoId,
        Guid clientBeltId,
        CancellationToken cancellationToken)
    {
        return await dbContext.ClientBelts
            .AsNoTracking()
            .Where(item => item.ClientInfoId == clientInfoId && item.Id == clientBeltId)
            .Select(ToOutputModel())
            .SingleAsync(cancellationToken);
    }

    private async Task EnsureAccessAsync(
        Guid clientInfoId,
        AuthenticatedUser user,
        CancellationToken cancellationToken)
    {
        var clientInfo = await GetClientInfoAsync(clientInfoId, cancellationToken);
        EnsureAccess(clientInfo, user);
    }

    private Task<ClientInfo?> GetClientInfoAsync(Guid clientInfoId, CancellationToken cancellationToken)
    {
        return dbContext.ClientInfos.SingleOrDefaultAsync(
            item => item.Id == clientInfoId,
            cancellationToken);
    }

    private async Task EnsureBeltExistsAsync(int beltId, CancellationToken cancellationToken)
    {
        if (!await dbContext.Belts.AnyAsync(item => item.Id == beltId, cancellationToken))
        {
            throw new AspNetException("Выбранный пояс не существует.", StatusCodes.Status400BadRequest);
        }
    }

    private static void ValidateStoredBelt(SaveClientBeltInputModel inputModel)
    {
        if (inputModel.StripesCount < 0)
        {
            throw new AspNetException(
                "Количество страйпов не может быть отрицательным.",
                StatusCodes.Status400BadRequest);
        }

        if (inputModel.ReceivedDate > DateOnly.FromDateTime(DateTime.Today))
        {
            throw new AspNetException(
                "Дата получения пояса не может быть в будущем.",
                StatusCodes.Status400BadRequest);
        }
    }

    private static System.Linq.Expressions.Expression<Func<ClientBelt, ClientBeltOutputModel>> ToOutputModel() =>
        clientBelt => new ClientBeltOutputModel
        {
            Id = clientBelt.Id,
            BeltId = clientBelt.BeltId,
            BeltName = clientBelt.Belt.Name,
            ReceivedDate = clientBelt.ReceivedDate,
            StripesCount = clientBelt.StripesCount
        };

    private static void EnsureAccess(ClientInfo? clientInfo, AuthenticatedUser user)
    {
        if (clientInfo is null)
        {
            throw new AspNetException("Профиль клиента не найден.", StatusCodes.Status404NotFound);
        }

        if (clientInfo.UserId != user.Id && user.Role != UserRolesEnum.Admin)
        {
            throw new AspNetException("Нет доступа к поясам этого клиента.", StatusCodes.Status403Forbidden);
        }
    }
}
