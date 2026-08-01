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
                Name = x.Group.Name,
                ColorId = x.Group.ColorId,
                ColorName = x.Group.Color.Name
            })
            .ToListAsync();

        logger.LogInformation("Группы тренера получены. UserId: {UserId} | Count: {Count}", user.Id, result.Count);
        return result;
    }

    public async Task DeleteGroup(Guid groupId, AuthenticatedUser user, CancellationToken cancellationToken)
    {
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
        if (user.Role != UserRolesEnum.Coach)
        {
            throw new UnauthorizedAccessException("Создавать группы может только тренер.");
        }

        if (string.IsNullOrWhiteSpace(inputModel.Name))
        {
            throw new ArgumentException("Необходимо указать название группы.", nameof(inputModel.Name));
        }

        var color = await dbContext.Colors
            .AsNoTracking()
            .SingleOrDefaultAsync(color => color.Id == inputModel.ColorId);

        if (color is null)
        {
            throw new ArgumentException("Выбранный цвет группы не существует.", nameof(inputModel.ColorId));
        }

        var coach = await dbContext.ClientInfos.SingleOrDefaultAsync(x => x.UserId == user.Id);

        if (coach is null)
        {
            coach = new ClientInfo { UserId = user.Id };
            dbContext.ClientInfos.Add(coach);
        }

        var group = new Group
        {
            Name = inputModel.Name.Trim(),
            ColorId = color.Id
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
            Name = group.Name,
            ColorId = group.ColorId,
            ColorName = color.Name
        };
    }

    public async Task<List<GetGroupColorsOutputModel>> GetGroupColors(AuthenticatedUser user, CancellationToken cancellationToken)
    {
        logger.LogInformation("Получение цветов групп. UserId: {UserId}", user.Id);
        EnsureCoach(user, "Получать цвета групп может только тренер.");

        var result = await dbContext.Colors
            .AsNoTracking()
            .OrderBy(color => color.Id)
            .Select(color => new GetGroupColorsOutputModel
            {
                Id = color.Id,
                Name = color.Name
            })
            .ToListAsync(cancellationToken);

        logger.LogInformation("Цвета групп получены. UserId: {UserId} | Count: {Count}", user.Id, result.Count);
        return result;
    }

    public async Task<UpdateGroupOutputModel> UpdateGroup(Guid groupId, UpdateGroupInputModel inputModel, AuthenticatedUser user, CancellationToken cancellationToken)
    {
        EnsureCoach(user, "Редактировать группы может только тренер.");

        if (string.IsNullOrWhiteSpace(inputModel.Name))
        {
            throw new ArgumentException("Необходимо указать название группы.", nameof(inputModel.Name));
        }

        var coachGroup = await dbContext.CoachGroups
            .Include(coachGroup => coachGroup.Group)
            .SingleOrDefaultAsync(coachGroup => coachGroup.GroupId == groupId && coachGroup.Coach.UserId == user.Id, cancellationToken);

        if (coachGroup is null)
        {
            throw new InvalidOperationException("Группа не принадлежит текущему тренеру.");
        }

        var color = await dbContext.Colors
            .AsNoTracking()
            .SingleOrDefaultAsync(color => color.Id == inputModel.ColorId, cancellationToken);

        if (color is null)
        {
            throw new ArgumentException("Выбранный цвет группы не существует.", nameof(inputModel.ColorId));
        }

        coachGroup.Group.Name = inputModel.Name.Trim();
        coachGroup.Group.ColorId = color.Id;
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Группа тренера отредактирована. UserId: {UserId} | GroupId: {GroupId} | ColorId: {ColorId}", user.Id, groupId, color.Id);
        return new UpdateGroupOutputModel
        {
            Id = coachGroup.Group.Id,
            Name = coachGroup.Group.Name,
            ColorId = color.Id,
            ColorName = color.Name
        };
    }

    private static void EnsureCoach(AuthenticatedUser user, string message)
    {
        if (user.Role != UserRolesEnum.Coach)
        {
            throw new UnauthorizedAccessException(message);
        }
    }
}
