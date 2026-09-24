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

    [HttpGet("requests")]
    [AllowedRoles(UserRolesEnum.Student)]
    public async Task<ActionResult<List<StudentRequestOutputModel>>> GetStudentRequests(CancellationToken cancellationToken)
    {
        return Ok(await trainerService.GetStudentRequestsAsync(CurrentUser, cancellationToken));
    }

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

    [HttpGet("students/requests")]
    [AllowedRoles(UserRolesEnum.Coach)]
    public async Task<ActionResult<List<StudentRequestOutputModel>>> GetCoachRequests(CancellationToken cancellationToken)
    {
        return Ok(await trainerService.GetCoachRequestsAsync(CurrentUser, cancellationToken));
    }

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

    [HttpGet("students")]
    [AllowedRoles(UserRolesEnum.Coach)]
    [ProducesResponseType<PagedResult<StudentOutputModel>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<StudentOutputModel>>> GetCoachStudents([FromQuery] Filter filter, CancellationToken cancellationToken)
    {
        return Ok(await trainerService.GetCoachStudentsAsync(CurrentUser, filter, cancellationToken));
    }

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
