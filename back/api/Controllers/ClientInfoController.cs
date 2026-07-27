using JiuDiary.Database;
using JiuDiary.Database.Entities;
using JiuDiary.Models.ClientInfo;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/client-info")]
[Produces("application/json")]
public sealed class ClientInfoController(JiuDiaryDbContext dbContext) : BaseController
{
    [HttpGet]
    [ProducesResponseType<ClientInfoOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ClientInfoOutputModel>> Get(
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(CurrentUser.Id, out var userId))
        {
            return Unauthorized();
        }

        var clientInfo = await dbContext.ClientInfos
            .Include(x => x.Belt)
            .SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        return Ok(clientInfo is null
            ? new ClientInfoOutputModel()
            : ToOutputModel(clientInfo));
    }

    [HttpPut]
    [ProducesResponseType<ClientInfoOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ClientInfoOutputModel>> Update(
        UpdateClientInfoInputModel request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(CurrentUser.Id, out var userId))
        {
            return Unauthorized();
        }

        var clientInfo = await dbContext.ClientInfos
            .SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (clientInfo is null)
        {
            var userExists = await dbContext.Users
                .AnyAsync(x => x.Id == userId, cancellationToken);
            if (!userExists)
            {
                return Unauthorized();
            }

            clientInfo = new ClientInfo { UserId = userId };
            dbContext.ClientInfos.Add(clientInfo);
        }

        clientInfo.Country = Normalize(request.Country);
        clientInfo.BirthDate = request.BirthDate;
        Belt? belt = null;
        if (request.BeltId.HasValue)
        {
            belt = await dbContext.Belts
                .SingleOrDefaultAsync(x => x.Id == request.BeltId.Value, cancellationToken);
            if (belt is null)
            {
                return BadRequest(new { error = "The selected belt does not exist." });
            }
        }

        clientInfo.BeltId = request.BeltId;
        clientInfo.Belt = belt;
        clientInfo.StripesCount = request.StripesCount;

        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToOutputModel(clientInfo));
    }

    private static ClientInfoOutputModel ToOutputModel(ClientInfo clientInfo) =>
        new()
        {
            Country = clientInfo.Country,
            BirthDate = clientInfo.BirthDate,
            BeltId = clientInfo.BeltId,
            BeltName = clientInfo.Belt?.Name,
            StripesCount = clientInfo.StripesCount
        };

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
