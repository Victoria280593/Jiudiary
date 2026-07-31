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
        [HttpPost]
        public async Task CreateBranch(CreateBranchInputModel inputModel, CancellationToken cancellationToken = default)
        {
            await branchService.CreateBranch(inputModel, CurrentUser);
        }

    }
}
