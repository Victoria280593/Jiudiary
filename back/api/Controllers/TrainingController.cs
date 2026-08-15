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
    public async Task<ActionResult<List<TrainingOutputModel>>> GetTrainings([FromQuery] Guid? groupId, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await trainingService.GetTrainings(CurrentUser, groupId, cancellationToken));
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

    [HttpDelete("{trainingId:guid}")]
    public async Task<ActionResult> DeleteTraining(Guid trainingId, CancellationToken cancellationToken)
    {
        try
        {
            await trainingService.DeleteTraining(trainingId, CurrentUser, cancellationToken);
            return NoContent();
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { error = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return NotFound(new { error = exception.Message });
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = exception.Message });
        }
    }

    [HttpPut("{trainingId:guid}")]
    public async Task<ActionResult<TrainingOutputModel>> UpdateTraining(
        Guid trainingId,
        UpdateTrainingInputModel inputModel,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await trainingService.UpdateTraining(trainingId, inputModel, CurrentUser, cancellationToken));
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { error = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return NotFound(new { error = exception.Message });
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = exception.Message });
        }
    }
}
