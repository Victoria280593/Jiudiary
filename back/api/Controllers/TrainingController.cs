using JiuDiary.Api.Services;
using JiuDiary.Models.ClientTraining;
using JiuDiary.Models.Submission;
using JiuDiary.Models.Training;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JiuDiary.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/trainings")]
[Produces("application/json")]
public sealed class TrainingController(TrainingService trainingService, SubmissionSearchService submissionSearchService) : BaseController
{
    /// <summary>
    /// Ищет приёмы по подстроке в названии или алиасах.
    /// </summary>
    /// <param name="query">Часть названия или алиаса приёма.</param>
    /// <returns>Подходящие приёмы, отсортированные по релевантности.</returns>
    [HttpGet("submissions/search")]
    [ProducesResponseType<IReadOnlyList<SubmissionSearchOutputModel>>(StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<SubmissionSearchOutputModel>> SearchSubmissions([FromQuery] string? query) => Ok(submissionSearchService.Search(query));

    /// <summary>
    /// Добавляет приём к отметке текущего клиента о тренировке.
    /// </summary>
    /// <param name="trainingId">Идентификатор тренировки.</param>
    /// <param name="inputModel">Идентификатор добавляемого приёма.</param>
    /// <param name="cancellationToken">Токен отмены запроса.</param>
    /// <returns>Добавленный приём с начальным количеством.</returns>
    [HttpPost("client/{trainingId:guid}/submissions")]
    [ProducesResponseType<ClientTrainingSubmissionOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ClientTrainingSubmissionOutputModel>> AddClientTrainingSubmission(Guid trainingId, AddClientTrainingSubmissionInputModel inputModel, CancellationToken cancellationToken) => Ok(await trainingService.AddClientTrainingSubmission(trainingId, inputModel, CurrentUser, cancellationToken));

    /// <summary>
    /// Изменяет количество выбранного приёма в отметке текущего клиента о тренировке.
    /// </summary>
    /// <param name="trainingId">Идентификатор тренировки.</param>
    /// <param name="submissionId">Идентификатор приёма.</param>
    /// <param name="inputModel">Новое количество выполнений приёма.</param>
    /// <param name="cancellationToken">Токен отмены запроса.</param>
    /// <returns>Приём с обновлённым количеством.</returns>
    [HttpPut("client/{trainingId:guid}/submissions/{submissionId:int}")]
    [ProducesResponseType<ClientTrainingSubmissionOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ClientTrainingSubmissionOutputModel>> UpdateClientTrainingSubmission(Guid trainingId, int submissionId, UpdateClientTrainingSubmissionInputModel inputModel, CancellationToken cancellationToken) => Ok(await trainingService.UpdateClientTrainingSubmission(trainingId, submissionId, inputModel, CurrentUser, cancellationToken));

    /// <summary>
    /// Удаляет выбранный приём из отметки текущего клиента о тренировке.
    /// </summary>
    /// <param name="trainingId">Идентификатор тренировки.</param>
    /// <param name="submissionId">Идентификатор удаляемого приёма.</param>
    /// <param name="cancellationToken">Токен отмены запроса.</param>
    [HttpDelete("client/{trainingId:guid}/submissions/{submissionId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteClientTrainingSubmission(Guid trainingId, int submissionId, CancellationToken cancellationToken)
    {
        await trainingService.DeleteClientTrainingSubmission(trainingId, submissionId, CurrentUser, cancellationToken);
        return NoContent();
    }

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
