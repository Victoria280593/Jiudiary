using JiuDiary.Api.Services;
using JiuDiary.Models.ClientDayNote;
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
    /// Получает личные заметки текущего клиента за выбранный день.
    /// </summary>
    /// <param name="date">Дата заметки.</param>
    /// <param name="cancellationToken">Токен отмены запроса.</param>
    /// <returns>Список заметок, отсортированных по времени создания.</returns>
    [HttpGet("client/day-notes")]
    [ProducesResponseType<List<GetClientDayNoteOutputModel>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<GetClientDayNoteOutputModel>>> GetClientDayNotes([FromQuery] DateOnly date, CancellationToken cancellationToken) => Ok(await trainingService.GetClientDayNotes(date, CurrentUser, cancellationToken));

    /// <summary>
    /// Создаёт личную заметку текущего клиента за выбранный день.
    /// </summary>
    /// <param name="inputModel">Дата и текст новой заметки.</param>
    /// <param name="cancellationToken">Токен отмены запроса.</param>
    /// <returns>Созданная заметка.</returns>
    [HttpPost("client/day-notes")]
    [ProducesResponseType<CreateClientDayNoteOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CreateClientDayNoteOutputModel>> CreateClientDayNote(CreateClientDayNoteInputModel inputModel, CancellationToken cancellationToken) => Ok(await trainingService.CreateClientDayNote(inputModel, CurrentUser, cancellationToken));

    /// <summary>
    /// Обновляет принадлежащую текущему клиенту дневную заметку.
    /// </summary>
    /// <param name="clientDayNoteId">Идентификатор заметки.</param>
    /// <param name="inputModel">Новый текст заметки.</param>
    /// <param name="cancellationToken">Токен отмены запроса.</param>
    /// <returns>Обновлённая заметка.</returns>
    [HttpPut("client/day-notes/{clientDayNoteId:guid}")]
    [ProducesResponseType<UpdateClientDayNoteOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UpdateClientDayNoteOutputModel>> UpdateClientDayNote(Guid clientDayNoteId, UpdateClientDayNoteInputModel inputModel, CancellationToken cancellationToken) => Ok(await trainingService.UpdateClientDayNote(clientDayNoteId, inputModel, CurrentUser, cancellationToken));

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
    /// Получает доступные текущему пользователю тренировки вместе с его отметками и личными заметками по дням.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<TrainingsOutputModel>> GetTrainings([FromQuery] List<Guid>? groupIds, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken cancellationToken)
        => Ok(await trainingService.GetTrainings(CurrentUser, groupIds, fromDate, toDate, cancellationToken));

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
