using JiuDiary.Api.Services;
using JiuDiary.Database.Enums;
using JiuDiary.Extensions.Models;
using JiuDiary.Models.Trainer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JiuDiary.Api.Controllers;

[ApiController]
[Authorize(Roles = nameof(UserRolesEnum.Student))]
[Route("api/trainers")]
[Produces("application/json")]
public sealed class TrainerController(TrainerService trainerService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<TrainerOutputModel>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<TrainerOutputModel>>> GetTrainers(
        [FromQuery] Filter filter,
        CancellationToken cancellationToken)
    {
        return Ok(await trainerService.GetTrainersAsync(filter, cancellationToken));
    }
}
