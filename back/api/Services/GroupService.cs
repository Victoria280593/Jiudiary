using JiuDiary.Api.Auth;
using JiuDiary.Database;
using JiuDiary.Database.Entities;
using JiuDiary.Database.Enums;
using JiuDiary.Models.Group;
using JiraDiary.AspCore.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.Services;

public sealed class GroupService(JiuDiaryDbContext dbContext, ILogger<GroupService> logger)
{
    public async Task<List<GetGroupsOutputModel>> GetGroups(AuthenticatedUser user, Guid? groupId)
    {
        if (user.Role != UserRolesEnum.Coach)
        {
            throw new AspNetException("Получать список групп может только тренер.", StatusCodes.Status403Forbidden);
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
                ColorName = x.Group.Color.Name,
                DefaultStartTime = x.Group.DefaultStartTime,
                DefaultEndTime = x.Group.DefaultEndTime
            })
            .ToListAsync();

        logger.LogInformation("Группы тренера получены. UserId: {UserId} | Count: {Count}", user.Id, result.Count);
        return result;
    }

    public async Task DeleteGroup(Guid groupId, AuthenticatedUser user, CancellationToken cancellationToken)
    {
        if (user.Role != UserRolesEnum.Coach)
        {
            throw new AspNetException("Удалять группы может только тренер.", StatusCodes.Status403Forbidden);
        }

        var coachGroup = await dbContext.CoachGroups
            .Include(x => x.Group)
            .SingleOrDefaultAsync(x => x.GroupId == groupId && x.Coach.UserId == user.Id, cancellationToken);

        if (coachGroup is null)
        {
            throw new AspNetException("Группа не принадлежит текущему тренеру.", StatusCodes.Status403Forbidden);
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
            throw new AspNetException("Создавать группы может только тренер.", StatusCodes.Status403Forbidden);
        }

        if (string.IsNullOrWhiteSpace(inputModel.Name))
        {
            throw new AspNetException("Необходимо указать название группы.", StatusCodes.Status400BadRequest);
        }

        var color = await dbContext.Colors
            .AsNoTracking()
            .SingleOrDefaultAsync(color => color.Id == inputModel.ColorId);

        if (color is null)
        {
            throw new AspNetException("Выбранный цвет группы не существует.", StatusCodes.Status400BadRequest);
        }

        ValidateDefaultTrainingTime(inputModel.DefaultStartTime, inputModel.DefaultEndTime);

        var coach = await dbContext.ClientInfos.SingleOrDefaultAsync(x => x.UserId == user.Id);

        if (coach is null)
        {
            coach = new ClientInfo { UserId = user.Id };
            dbContext.ClientInfos.Add(coach);
        }

        var group = new Group
        {
            Name = inputModel.Name.Trim(),
            ColorId = color.Id,
            DefaultStartTime = inputModel.DefaultStartTime,
            DefaultEndTime = inputModel.DefaultEndTime
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
            ColorName = color.Name,
            DefaultStartTime = group.DefaultStartTime,
            DefaultEndTime = group.DefaultEndTime
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
            throw new AspNetException("Необходимо указать название группы.", StatusCodes.Status400BadRequest);
        }

        var coachGroup = await dbContext.CoachGroups
            .Include(coachGroup => coachGroup.Group)
            .SingleOrDefaultAsync(coachGroup => coachGroup.GroupId == groupId && coachGroup.Coach.UserId == user.Id, cancellationToken);

        if (coachGroup is null)
        {
            throw new AspNetException("Группа не принадлежит текущему тренеру.", StatusCodes.Status403Forbidden);
        }

        var color = await dbContext.Colors
            .AsNoTracking()
            .SingleOrDefaultAsync(color => color.Id == inputModel.ColorId, cancellationToken);

        if (color is null)
        {
            throw new AspNetException("Выбранный цвет группы не существует.", StatusCodes.Status400BadRequest);
        }

        ValidateDefaultTrainingTime(inputModel.DefaultStartTime, inputModel.DefaultEndTime);

        coachGroup.Group.Name = inputModel.Name.Trim();
        coachGroup.Group.ColorId = color.Id;
        coachGroup.Group.DefaultStartTime = inputModel.DefaultStartTime;
        coachGroup.Group.DefaultEndTime = inputModel.DefaultEndTime;
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Группа тренера отредактирована. UserId: {UserId} | GroupId: {GroupId} | ColorId: {ColorId}", user.Id, groupId, color.Id);
        return new UpdateGroupOutputModel
        {
            Id = coachGroup.Group.Id,
            Name = coachGroup.Group.Name,
            ColorId = color.Id,
            ColorName = color.Name,
            DefaultStartTime = coachGroup.Group.DefaultStartTime,
            DefaultEndTime = coachGroup.Group.DefaultEndTime
        };
    }

    private static void ValidateDefaultTrainingTime(TimeSpan? defaultStartTime, TimeSpan? defaultEndTime)
    {
        if (!defaultStartTime.HasValue && !defaultEndTime.HasValue)
        {
            return;
        }

        if (!defaultStartTime.HasValue)
        {
            throw new AspNetException("Необходимо указать время начала тренировки.", StatusCodes.Status400BadRequest);
        }

        if (!defaultEndTime.HasValue)
        {
            throw new AspNetException("Необходимо указать время окончания тренировки.", StatusCodes.Status400BadRequest);
        }

        if (defaultEndTime.Value <= defaultStartTime.Value)
        {
            throw new AspNetException("Время окончания тренировки должно быть позже времени начала.", StatusCodes.Status400BadRequest);
        }
    }
    private static void EnsureCoach(AuthenticatedUser user, string message)
    {
        if (user.Role != UserRolesEnum.Coach)
        {
            throw new AspNetException(message, StatusCodes.Status403Forbidden);
        }
    }
}
