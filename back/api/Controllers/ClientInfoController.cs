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
        clientInfo.Belt = Normalize(request.Belt);
        clientInfo.StripesCount = request.StripesCount;

        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new ClientInfoOutputModel
        {
            Country = clientInfo.Country,
            BirthDate = clientInfo.BirthDate,
            Belt = clientInfo.Belt,
            StripesCount = clientInfo.StripesCount
        });
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
