using JiuDiary.Api.Services;
using JiuDiary.Models.Training;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JiuDiary.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/trainings")]
[Produces("application/json")]
public sealed class TrainingController(TrainingService trainingService) : BaseController
{
    [HttpGet]
    public async Task<ActionResult<List<TrainingOutputModel>>> GetTrainings(CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await trainingService.GetTrainings(CurrentUser, cancellationToken));
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = exception.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<TrainingOutputModel>> CreateTraining(CreateTrainingInputModel inputModel, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await trainingService.CreateTraining(inputModel, CurrentUser, cancellationToken));
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = exception.Message });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { error = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = exception.Message });
        }
    }
}
