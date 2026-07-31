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

            var coachId = await dbContext.ClientInfos
                .Where(x => x.UserId == user.Id)
                .Select(x => x.Id)
                .SingleOrDefaultAsync();

            if (coachId == Guid.Empty)
            {
                throw new InvalidOperationException("Информация о тренере не найдена.");
            }

            var branch = new Branch
            {
                Name = inputModel.Name.Trim()
            };

            dbContext.Branches.Add(branch);
            dbContext.CoachBranches.Add(new CoachBranch
            {
                CoachId = coachId,
                Branch = branch
            });

            await dbContext.SaveChangesAsync();
        }
    }
}
