using JiuDiary.Api.Auth;
using JiuDiary.Database;
using JiuDiary.Database.Entities;
using JiuDiary.Database.Enums;
using JiuDiary.Models.Group;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.Services;

public sealed class GroupService(JiuDiaryDbContext dbContext, ILogger<GroupService> logger)
{
    public async Task<List<GetGroupsOutputModel>> GetGroups(AuthenticatedUser user, Guid? groupId)
    {
        logger.LogInformation("Получение групп тренера. UserId: {UserId} | GroupId: {GroupId}", user.Id, groupId);

        if (user.Role != UserRolesEnum.Coach)
        {
            throw new UnauthorizedAccessException("Получать список групп может только тренер.");
        }

        var groups = dbContext.CoachGroups
            .AsNoTracking()
            .Where(x => x.Coach.UserId == user.Id);

        if (groupId.HasValue)
        {
            groups = groups.Where(x => x.GroupId == groupId.Value);
        }

        var result = await groups
            .Select(x => new GetGroupsOutputModel
            {
                Id = x.Group.Id,
                Name = x.Group.Name
            })
            .ToListAsync();

        logger.LogInformation("Группы тренера получены. UserId: {UserId} | Count: {Count}", user.Id, result.Count);
        return result;
    }

    public async Task DeleteGroup(Guid groupId, AuthenticatedUser user, CancellationToken cancellationToken)
    {
        logger.LogInformation("Удаление группы тренера. UserId: {UserId} | GroupId: {GroupId}", user.Id, groupId);

        if (user.Role != UserRolesEnum.Coach)
        {
            throw new UnauthorizedAccessException("Удалять группы может только тренер.");
        }

        var coachGroup = await dbContext.CoachGroups
            .Include(x => x.Group)
            .SingleOrDefaultAsync(x => x.GroupId == groupId && x.Coach.UserId == user.Id, cancellationToken);

        if (coachGroup is null)
        {
            throw new InvalidOperationException("Группа не принадлежит текущему тренеру.");
        }

        var belongsToAnotherCoach = await dbContext.CoachGroups
            .AnyAsync(x => x.GroupId == groupId && x.Id != coachGroup.Id, cancellationToken);

        var trainings = await dbContext.Trainings
            .Where(x => x.GroupId == groupId &&
                        (!belongsToAnotherCoach || x.CoachId == coachGroup.CoachId))
            .ToListAsync(cancellationToken);

        dbContext.Trainings.RemoveRange(trainings);
        dbContext.CoachGroups.Remove(coachGroup);
        if (!belongsToAnotherCoach)
        {
            dbContext.Groups.Remove(coachGroup.Group);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Группа тренера удалена. UserId: {UserId} | GroupId: {GroupId} | TrainingsDeleted: {TrainingsDeleted}", user.Id, groupId, trainings.Count);
    }

    public async Task<CreateGroupOutputModel> CreateGroup(CreateGroupInputModel inputModel, AuthenticatedUser user)
    {
        logger.LogInformation("Создание группы тренера. UserId: {UserId}", user.Id);

        if (user.Role != UserRolesEnum.Coach)
        {
            throw new UnauthorizedAccessException("Создавать группы может только тренер.");
        }

        if (string.IsNullOrWhiteSpace(inputModel.Name))
        {
            throw new ArgumentException("Необходимо указать название группы.", nameof(inputModel.Name));
        }

        var coach = await dbContext.ClientInfos.SingleOrDefaultAsync(x => x.UserId == user.Id);

        if (coach is null)
        {
            coach = new ClientInfo { UserId = user.Id };
            dbContext.ClientInfos.Add(coach);
        }

        var group = new Group
        {
            Name = inputModel.Name.Trim()
        };

        dbContext.Groups.Add(group);
        dbContext.CoachGroups.Add(new CoachGroup
        {
            Coach = coach,
            Group = group
        });

        await dbContext.SaveChangesAsync();
        logger.LogInformation("Группа тренера создана. UserId: {UserId} | GroupId: {GroupId}", user.Id, group.Id);

        return new CreateGroupOutputModel
        {
            Id = group.Id,
            Name = group.Name
        };
    }
}
