using JiuDiary.Api.Services;
using JiuDiary.Models.Branch;
using JiuDiary.Models.ClientInfo;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JiuDiary.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/branches")]
    [Produces("application/json")]
    public sealed class BranchConroller(BranchService branchService) : BaseController
    {
        [HttpGet]
        public async Task<ActionResult<List<GetBranchesOutputModel>>> GetBranches()
        {
            return Ok(await branchService.GetBranches(CurrentUser));
        }

        [HttpDelete("{branchId:guid}")]
        public async Task<IActionResult> DeleteBranch(Guid branchId)
        {
            try
            {
                await branchService.DeleteBranch(branchId, CurrentUser);
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
        public async Task CreateBranch(CreateBranchInputModel inputModel, CancellationToken cancellationToken = default)
        {
            await branchService.CreateBranch(inputModel, CurrentUser);
        }

    }
}
