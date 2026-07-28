using JiuDiary.Api.Services;
using JiuDiary.Models.ClientInfo;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JiuDiary.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/client-info")]
[Produces("application/json")]
public sealed class ClientInfoController(IClientInfoService clientInfoService) : BaseController
{
    [HttpGet]
    [ProducesResponseType<ClientInfoOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ClientInfoOutputModel>> Get(CancellationToken cancellationToken)
    {
        return !Guid.TryParse(CurrentUser.Id, out var userId)
            ? Unauthorized()
            : Ok(await clientInfoService.GetAsync(userId, cancellationToken));
    }

    [HttpPut]
    [ProducesResponseType<ClientInfoOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ClientInfoOutputModel>> Update(UpdateClientInfoInputModel inputModel, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(CurrentUser.Id, out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var clientInfo = await clientInfoService.UpdateAsync(userId, inputModel, cancellationToken);
            return clientInfo is null
                ? Unauthorized()
                : Ok(clientInfo);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { error = exception.Message });
        }
    }
}
