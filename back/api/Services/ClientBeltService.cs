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
            .Select(clientBelt => new ClientBeltOutputModel
            {
                Id = clientBelt.Id,
                BeltId = clientBelt.BeltId,
                BeltName = clientBelt.Belt.Name,
                ReceivedDate = clientBelt.ReceivedDate,
                StripesCount = clientBelt.StripesCount
            })
            .ToListAsync(cancellationToken);

        logger.LogInformation(
            "История поясов клиента получена. ClientInfoId: {ClientInfoId} | Count: {Count}",
            clientInfoId,
            clientBelts.Count);

        return clientBelts;
    }

    public async Task<ClientBeltOutputModel> ChangeAsync(
        Guid clientInfoId,
        ChangeClientBeltInputModel inputModel,
        AuthenticatedUser user,
        CancellationToken cancellationToken)
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

        var clientInfo = await dbContext.ClientInfos
            .SingleOrDefaultAsync(item => item.Id == clientInfoId, cancellationToken);

        EnsureAccess(clientInfo, user);

        var belt = await dbContext.Belts
            .SingleOrDefaultAsync(item => item.Id == inputModel.BeltId, cancellationToken);

        if (belt is null)
        {
            throw new AspNetException("Выбранный пояс не существует.", StatusCodes.Status400BadRequest);
        }

        ClientBelt? clientBelt = null;
        if (clientInfo!.BeltId == inputModel.BeltId)
        {
            clientBelt = await dbContext.ClientBelts
                .Where(item => item.ClientInfoId == clientInfoId && item.BeltId == inputModel.BeltId)
                .OrderByDescending(item => item.ReceivedDate)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (clientBelt is null)
        {
            clientBelt = new ClientBelt
            {
                ClientInfoId = clientInfoId,
                BeltId = inputModel.BeltId
            };
            dbContext.ClientBelts.Add(clientBelt);
        }

        clientBelt.ReceivedDate = inputModel.ReceivedDate;
        clientBelt.StripesCount = inputModel.StripesCount;
        clientInfo.BeltId = inputModel.BeltId;

        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Пояс клиента изменён. ClientInfoId: {ClientInfoId} | BeltId: {BeltId}",
            clientInfoId,
            inputModel.BeltId);

        return new ClientBeltOutputModel
        {
            Id = clientBelt.Id,
            BeltId = clientBelt.BeltId,
            BeltName = belt.Name,
            ReceivedDate = clientBelt.ReceivedDate,
            StripesCount = clientBelt.StripesCount
        };
    }

    private async Task EnsureAccessAsync(
        Guid clientInfoId,
        AuthenticatedUser user,
        CancellationToken cancellationToken)
    {
        var clientInfo = await dbContext.ClientInfos
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == clientInfoId, cancellationToken);

        EnsureAccess(clientInfo, user);
    }

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
