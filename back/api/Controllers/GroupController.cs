using JiuDiary.Api.Services;
using JiuDiary.Models.Group;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JiuDiary.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/groups")]
[Produces("application/json")]
public sealed class GroupController(GroupService groupService) : BaseController
{
    [HttpGet]
    public async Task<ActionResult<List<GetGroupsOutputModel>>> GetGroups([FromQuery] Guid? groupId)
    {
        return Ok(await groupService.GetGroups(CurrentUser, groupId));
    }

    [HttpDelete("{groupId:guid}")]
    public async Task<IActionResult> DeleteGroup(Guid groupId, CancellationToken cancellationToken)
    {
        try
        {
            await groupService.DeleteGroup(groupId, CurrentUser, cancellationToken);
            return NoContent();
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = exception.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<CreateGroupOutputModel>> CreateGroup(CreateGroupInputModel inputModel)
    {
        return Ok(await groupService.CreateGroup(inputModel, CurrentUser));
    }

    [HttpGet("colors")]
    public async Task<ActionResult<List<GetGroupColorsOutputModel>>> GetGroupColors(CancellationToken cancellationToken)
    {
        return Ok(await groupService.GetGroupColors(CurrentUser, cancellationToken));
    }

    [HttpPut("{groupId:guid}")]
    public async Task<ActionResult<UpdateGroupOutputModel>> UpdateGroup(Guid groupId, UpdateGroupInputModel inputModel, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await groupService.UpdateGroup(groupId, inputModel, CurrentUser, cancellationToken));
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = exception.Message });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { error = exception.Message });
        }
    }
}
