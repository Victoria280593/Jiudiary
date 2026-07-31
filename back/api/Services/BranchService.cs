using JiuDiary.Api.Auth;
using JiuDiary.Database;
using JiuDiary.Database.Entities;
using JiuDiary.Database.Enums;
using JiuDiary.Models.Branch;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.Services
{
    public sealed class BranchService(JiuDiaryDbContext dbContext)
    {
        public async Task<List<GetBranchesOutputModel>> GetBranches(AuthenticatedUser user)
        {
            if (user.Role != UserRolesEnum.Coach)
            {
                throw new UnauthorizedAccessException("Получать список филиалов может только тренер.");
            }

            return await dbContext.CoachBranches
                .AsNoTracking()
                .Where(x => x.Coach.UserId == user.Id)
                .Select(x => new GetBranchesOutputModel
                {
                    Id = x.Branch.Id,
                    Name = x.Branch.Name
                })
                .ToListAsync();
        }

        public async Task CreateBranch(CreateBranchInputModel inputModel, AuthenticatedUser user)
        {
            if (user.Role != UserRolesEnum.Coach)
            {
                throw new UnauthorizedAccessException("Создавать филиалы может только тренер.");
            }

            if (string.IsNullOrWhiteSpace(inputModel.Name))
            {
                throw new ArgumentException("Необходимо указать название филиала.", nameof(inputModel.Name));
            }

            var coach = await dbContext.ClientInfos
                .SingleOrDefaultAsync(x => x.UserId == user.Id);

            if (coach is null)
            {
                coach = new ClientInfo { UserId = user.Id };
                dbContext.ClientInfos.Add(coach);
            }

            var branch = new Branch
            {
                Name = inputModel.Name.Trim()
            };

            dbContext.Branches.Add(branch);
            dbContext.CoachBranches.Add(new CoachBranch
            {
                Coach = coach,
                Branch = branch
            });

            await dbContext.SaveChangesAsync();
        }
    }
}
