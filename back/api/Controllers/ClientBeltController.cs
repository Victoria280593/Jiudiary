using JiuDiary.Api.Services;
using JiuDiary.Models.ClientBelt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JiuDiary.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/client-info/{clientInfoId:guid}/belts")]
[Produces("application/json")]
public sealed class ClientBeltController(ClientBeltService clientBeltService) : BaseController
{
    [HttpGet]
    [ProducesResponseType<List<ClientBeltOutputModel>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ClientBeltOutputModel>>> Get(
        Guid clientInfoId,
        CancellationToken cancellationToken)
    {
        return Ok(await clientBeltService.GetAsync(clientInfoId, CurrentUser, cancellationToken));
    }

    [HttpPut("current")]
    [ProducesResponseType<ClientBeltOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ClientBeltOutputModel>> Change(
        Guid clientInfoId,
        ChangeClientBeltInputModel inputModel,
        CancellationToken cancellationToken)
    {
        return Ok(await clientBeltService.ChangeAsync(
            clientInfoId,
            inputModel,
            CurrentUser,
            cancellationToken));
    }
}
