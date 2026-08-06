using JiuDiary.Database;
using JiuDiary.Database.Enums;
using JiuDiary.Extensions;
using JiuDiary.Extensions.Models;
using JiuDiary.Models.Trainer;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.Services;

public sealed class TrainerService(JiuDiaryDbContext dbContext)
{
    public Task<PagedResult<TrainerOutputModel>> GetTrainersAsync(
        Filter filter,
        CancellationToken cancellationToken)
    {
        var trainers = dbContext.Users
            .AsNoTracking()
            .Where(user => user.IsActive && user.RoleId == (int)UserRolesEnum.Coach)
            .ApplySearch(
                filter.Search,
                search => user => user.Name.Contains(search) || user.Login.Contains(search))
            .OrderBy(user => user.Name)
            .ThenBy(user => user.Login)
            .Select(user => new TrainerOutputModel
            {
                Id = user.Id,
                Name = user.Name,
                Login = user.Login,
                BeltId = user.ClientInfo == null ? null : user.ClientInfo.BeltId,
                BeltName = user.ClientInfo == null || user.ClientInfo.Belt == null
                    ? null
                    : user.ClientInfo.Belt.Name
            });

        return trainers.ToPagedResultAsync(filter, cancellationToken);
    }
}
