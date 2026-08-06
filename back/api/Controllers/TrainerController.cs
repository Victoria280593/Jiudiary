using JiuDiary.Api.Services;
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
    [HttpGet]
    [Authorize(Roles = nameof(UserRolesEnum.Student))]
    [ProducesResponseType<PagedResult<TrainerOutputModel>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<TrainerOutputModel>>> GetTrainers(
        [FromQuery] Filter filter,
        CancellationToken cancellationToken)
    {
        return Ok(await trainerService.GetTrainersAsync(filter, cancellationToken));
    }

    [HttpPost("{coachId:guid}/students/requests")]
    [Authorize(Roles = nameof(UserRolesEnum.Student))]
    [ProducesResponseType<StudentRequestOutputModel>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StudentRequestOutputModel>> CreateStudentRequest(
        Guid coachId,
        CancellationToken cancellationToken)
    {
        try
        {
            var request = await trainerService.CreateStudentRequestAsync(CurrentUser, coachId, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, request);
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { error = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { error = exception.Message });
        }
    }

    [HttpGet("requests")]
    [Authorize(Roles = nameof(UserRolesEnum.Student))]
    public async Task<ActionResult<List<StudentRequestOutputModel>>> GetStudentRequests(
        CancellationToken cancellationToken)
    {
        return Ok(await trainerService.GetStudentRequestsAsync(CurrentUser, cancellationToken));
    }

    [HttpGet("my")]
    [Authorize(Roles = nameof(UserRolesEnum.Student))]
    public async Task<ActionResult<List<TrainerOutputModel>>> GetStudentTrainers(
        CancellationToken cancellationToken)
    {
        return Ok(await trainerService.GetStudentTrainersAsync(CurrentUser, cancellationToken));
    }

    [HttpGet("students/requests")]
    [Authorize(Roles = nameof(UserRolesEnum.Coach))]
    public async Task<ActionResult<List<StudentRequestOutputModel>>> GetCoachRequests(
        CancellationToken cancellationToken)
    {
        return Ok(await trainerService.GetCoachRequestsAsync(CurrentUser, cancellationToken));
    }

    [HttpPatch("students/requests/{requestId:guid}")]
    [Authorize(Roles = nameof(UserRolesEnum.Coach))]
    [ProducesResponseType<StudentRequestOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StudentRequestOutputModel>> ResolveStudentRequest(
        Guid requestId,
        UpdateStudentRequestInputModel inputModel,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await trainerService.ResolveStudentRequestAsync(
                CurrentUser,
                requestId,
                inputModel.Status,
                cancellationToken));
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { error = exception.Message });
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { error = exception.Message });
        }
    }

    [HttpGet("students")]
    [Authorize(Roles = nameof(UserRolesEnum.Coach))]
    public async Task<ActionResult<List<StudentOutputModel>>> GetCoachStudents(
        CancellationToken cancellationToken)
    {
        return Ok(await trainerService.GetCoachStudentsAsync(CurrentUser, cancellationToken));
    }
}
