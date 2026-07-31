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
    public async Task<ActionResult<List<GetGroupsOutputModel>>> GetGroups()
    {
        return Ok(await groupService.GetGroups(CurrentUser));
    }

    [HttpDelete("{groupId:guid}")]
    public async Task<IActionResult> DeleteGroup(Guid groupId)
    {
        try
        {
            await groupService.DeleteGroup(groupId, CurrentUser);
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
    public async Task CreateGroup(CreateGroupInputModel inputModel)
    {
        await groupService.CreateGroup(inputModel, CurrentUser);
    }
}
