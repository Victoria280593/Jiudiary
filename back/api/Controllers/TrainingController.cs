using JiuDiary.Api.Services;
using JiuDiary.Models.ClientTraining;
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
    /// <summary>
    /// Создаёт или обновляет отметку текущего клиента о тренировке.
    /// </summary>
    [HttpPut("client/{trainingId:guid}")]
    [ProducesResponseType<ClientTrainingOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ClientTrainingOutputModel>> SaveClientTraining(Guid trainingId, SaveClientTrainingInputModel inputModel, CancellationToken cancellationToken)
        => Ok(await trainingService.SaveClientTraining(trainingId, inputModel, CurrentUser, cancellationToken));

    /// <summary>
    /// Получает доступные текущему пользователю тренировки вместе с его отметками.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<TrainingOutputModel>>> GetTrainings([FromQuery] List<Guid>? groupIds, CancellationToken cancellationToken)
        => Ok(await trainingService.GetTrainings(CurrentUser, groupIds, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<TrainingOutputModel>> CreateTraining(CreateTrainingInputModel inputModel, CancellationToken cancellationToken)
        => Ok(await trainingService.CreateTraining(inputModel, CurrentUser, cancellationToken));

    [HttpDelete("{trainingId:guid}")]
    public async Task<ActionResult> DeleteTraining(
        Guid trainingId,
        CancellationToken cancellationToken,
        [FromQuery] bool deleteAllAfterThis = false)
    {
        await trainingService.DeleteTraining(trainingId, deleteAllAfterThis, CurrentUser, cancellationToken);
        return NoContent();
    }

    [HttpPut("{trainingId:guid}")]
    public async Task<ActionResult<TrainingOutputModel>> UpdateTraining(
        Guid trainingId,
        UpdateTrainingInputModel inputModel,
        CancellationToken cancellationToken)
        => Ok(await trainingService.UpdateTraining(trainingId, inputModel, CurrentUser, cancellationToken));
}
