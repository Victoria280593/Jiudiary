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
        => Ok(await trainingService.GetTrainings(CurrentUser, groupId, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<TrainingOutputModel>> CreateTraining(CreateTrainingInputModel inputModel, CancellationToken cancellationToken)
        => Ok(await trainingService.CreateTraining(inputModel, CurrentUser, cancellationToken));

    [HttpDelete("{trainingId:guid}")]
    public async Task<ActionResult> DeleteTraining(Guid trainingId, CancellationToken cancellationToken)
    {
        await trainingService.DeleteTraining(trainingId, CurrentUser, cancellationToken);
        return NoContent();
    }

    [HttpPut("{trainingId:guid}")]
    public async Task<ActionResult<TrainingOutputModel>> UpdateTraining(
        Guid trainingId,
        UpdateTrainingInputModel inputModel,
        CancellationToken cancellationToken)
        => Ok(await trainingService.UpdateTraining(trainingId, inputModel, CurrentUser, cancellationToken));
}
