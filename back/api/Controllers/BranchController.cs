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

        [HttpPost]
        public async Task CreateBranch(CreateBranchInputModel inputModel, CancellationToken cancellationToken = default)
        {
            await branchService.CreateBranch(inputModel, CurrentUser);
        }

    }
}
