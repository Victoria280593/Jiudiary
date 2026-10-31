using JiuDiary.Api.Services;
using JiuDiary.Api.Auth;
using JiuDiary.Database.Enums;
using JiuDiary.Extensions.Models;
using JiuDiary.Models.Trainer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JiuDiary.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/trainers")]
[Produces("application/json")]
public sealed class TrainerController(TrainerService trainerService) : BaseController
{
    /// <summary>
    /// Получает доступных для подачи заявки тренеров, исключая уже прикреплённых.
    /// </summary>
    [HttpGet]
    [AllowedRoles(UserRolesEnum.Student)]
    [ProducesResponseType<PagedResult<TrainerOutputModel>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<TrainerOutputModel>>> GetTrainers([FromQuery] Filter filter, CancellationToken cancellationToken)
    {
        return Ok(await trainerService.GetTrainersAsync(CurrentUser, filter, cancellationToken));
    }

    /// <summary>
    /// Создаёт заявку ученика к тренеру.
    /// </summary>
    [HttpPost("{coachId:guid}/students/requests")]
    [AllowedRoles(UserRolesEnum.Student)]
    [ProducesResponseType<StudentRequestOutputModel>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StudentRequestOutputModel>> CreateStudentRequest(Guid coachId, CancellationToken cancellationToken)
    {
        var request = await trainerService.CreateStudentRequestAsync(CurrentUser, coachId, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, request);
    }

    /// <summary>
    /// Возвращает заявки текущего ученика.
    /// </summary>
    [HttpGet("requests")]
    [AllowedRoles(UserRolesEnum.Student)]
    public async Task<ActionResult<List<StudentRequestOutputModel>>> GetStudentRequests(CancellationToken cancellationToken)
    {
        return Ok(await trainerService.GetStudentRequestsAsync(CurrentUser, cancellationToken));
    }

    /// <summary>
    /// Возвращает тренеров текущего ученика.
    /// </summary>
    [HttpGet("my")]
    [AllowedRoles(UserRolesEnum.Student)]
    public async Task<ActionResult<List<TrainerOutputModel>>> GetStudentTrainers(CancellationToken cancellationToken)
    {
        return Ok(await trainerService.GetStudentTrainersAsync(CurrentUser, cancellationToken));
    }

    /// <summary>
    /// Открепляет текущего ученика от выбранного тренера.
    /// </summary>
    [HttpDelete("my/{coachId:guid}")]
    [AllowedRoles(UserRolesEnum.Student)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveStudentTrainer(Guid coachId, CancellationToken cancellationToken)
    {
        var removed = await trainerService.RemoveStudentTrainerAsync(CurrentUser, coachId, cancellationToken);
        return removed ? NoContent() : NotFound(new { error = "Связь с тренером не найдена." });
    }

    /// <summary>
    /// Возвращает заявки тренеру от учеников.
    /// </summary>
    [HttpGet("students/requests")]
    [AllowedRoles(UserRolesEnum.Coach)]
    public async Task<ActionResult<List<StudentRequestOutputModel>>> GetCoachRequests(CancellationToken cancellationToken)
    {
        return Ok(await trainerService.GetCoachRequestsAsync(CurrentUser, cancellationToken));
    }

    /// <summary>
    /// Принимает или отклоняет заявку ученика.
    /// </summary>
    [HttpPatch("students/requests/{requestId:guid}")]
    [AllowedRoles(UserRolesEnum.Coach)]
    [ProducesResponseType<StudentRequestOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StudentRequestOutputModel>> ResolveStudentRequest(Guid requestId, UpdateStudentRequestInputModel inputModel, CancellationToken cancellationToken)
        => Ok(await trainerService.ResolveStudentRequestAsync(
            CurrentUser,
            requestId,
            inputModel.Status,
            cancellationToken));

    /// <summary>
    /// Удаляет заявку ученика или тренера.
    /// </summary>
    [HttpDelete("students/requests/{requestId:guid}")]
    [AllowedRoles(UserRolesEnum.Coach, UserRolesEnum.Student)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStudentRequest(Guid requestId, CancellationToken cancellationToken)
    {
        var deleted = await trainerService.DeleteStudentRequestAsync(CurrentUser, requestId, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { error = "Заявка не найдена." });
        }

        return NoContent();
    }

    /// <summary>
    /// Возвращает учеников текущей команды.
    /// </summary>
    [HttpGet("students")]
    [AllowedRoles(UserRolesEnum.Coach, UserRolesEnum.Student)]
    [ProducesResponseType<PagedResult<StudentOutputModel>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<StudentOutputModel>>> GetStudents([FromQuery] Filter filter, CancellationToken cancellationToken)
    {
        return Ok(await trainerService.GetStudentsAsync(CurrentUser, filter, cancellationToken));
    }

    /// <summary>
    /// Обновляет группы ученика.
    /// </summary>
    [HttpPut("students/{studentId:guid}/groups")]
    [AllowedRoles(UserRolesEnum.Coach)]
    [ProducesResponseType<List<StudentGroupOutputModel>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<StudentGroupOutputModel>>> UpdateStudentGroups(
        Guid studentId,
        UpdateStudentGroupsInputModel inputModel,
        CancellationToken cancellationToken)
        => Ok(await trainerService.UpdateCoachStudentGroupsAsync(CurrentUser, studentId, inputModel, cancellationToken));

    /// <summary>
    /// Удаляет ученика из команды тренера.
    /// </summary>
    [HttpDelete("students/{studentId:guid}")]
    [AllowedRoles(UserRolesEnum.Coach)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveCoachStudent(Guid studentId, CancellationToken cancellationToken)
    {
        var removed = await trainerService.RemoveCoachStudentAsync(
            CurrentUser,
            studentId,
            cancellationToken);
        return removed ? NoContent() : NotFound();
    }
}
