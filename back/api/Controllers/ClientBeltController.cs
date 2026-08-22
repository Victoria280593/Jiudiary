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

    [HttpPost]
    [ProducesResponseType<ClientBeltOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ClientBeltOutputModel>> Create(
        Guid clientInfoId,
        SaveClientBeltInputModel inputModel,
        CancellationToken cancellationToken)
    {
        return Ok(await clientBeltService.CreateAsync(
            clientInfoId,
            inputModel,
            CurrentUser,
            cancellationToken));
    }

    [HttpPut("{clientBeltId:guid}")]
    [ProducesResponseType<ClientBeltOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ClientBeltOutputModel>> Update(
        Guid clientInfoId,
        Guid clientBeltId,
        SaveClientBeltInputModel inputModel,
        CancellationToken cancellationToken)
    {
        return Ok(await clientBeltService.UpdateAsync(
            clientInfoId,
            clientBeltId,
            inputModel,
            CurrentUser,
            cancellationToken));
    }

    [HttpPut("current")]
    [ProducesResponseType<CurrentBeltOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CurrentBeltOutputModel>> ChangeCurrent(
        Guid clientInfoId,
        ChangeCurrentBeltInputModel inputModel,
        CancellationToken cancellationToken)
    {
        return Ok(await clientBeltService.ChangeCurrentAsync(
            clientInfoId,
            inputModel,
            CurrentUser,
            cancellationToken));
    }
}
