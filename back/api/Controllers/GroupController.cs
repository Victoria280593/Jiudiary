using JiuDiary.Api.Services;
using JiuDiary.Api.Auth;
using JiuDiary.Database.Enums;
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
    [AllowedRoles(UserRolesEnum.Coach, UserRolesEnum.Student)]
    public async Task<ActionResult<List<GetGroupsOutputModel>>> GetGroups([FromQuery] Guid? groupId)
    {
        return Ok(await groupService.GetGroups(CurrentUser, groupId));
    }

    [HttpDelete("{groupId:guid}")]
    [AllowedRoles(UserRolesEnum.Coach)]
    public async Task<IActionResult> DeleteGroup(Guid groupId, CancellationToken cancellationToken)
    {
        await groupService.DeleteGroup(groupId, CurrentUser, cancellationToken);
        return NoContent();
    }

    [HttpPost]
    [AllowedRoles(UserRolesEnum.Coach)]
    public async Task<ActionResult<CreateGroupOutputModel>> CreateGroup(CreateGroupInputModel inputModel)
    {
        return Ok(await groupService.CreateGroup(inputModel, CurrentUser));
    }

    [HttpGet("colors")]
    [AllowedRoles(UserRolesEnum.Coach)]
    public async Task<ActionResult<List<GetGroupColorsOutputModel>>> GetGroupColors(CancellationToken cancellationToken)
    {
        return Ok(await groupService.GetGroupColors(CurrentUser, cancellationToken));
    }

    [HttpPut("{groupId:guid}")]
    [AllowedRoles(UserRolesEnum.Coach)]
    public async Task<ActionResult<UpdateGroupOutputModel>> UpdateGroup(Guid groupId, UpdateGroupInputModel inputModel, CancellationToken cancellationToken)
        => Ok(await groupService.UpdateGroup(groupId, inputModel, CurrentUser, cancellationToken));
}
