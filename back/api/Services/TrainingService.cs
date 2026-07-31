using JiuDiary.Api.Auth;
using JiuDiary.Database;
using JiuDiary.Database.Entities;
using JiuDiary.Database.Enums;
using JiuDiary.Models.Training;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.Services;

public sealed class TrainingService(JiuDiaryDbContext dbContext)
{
    public async Task<List<TrainingOutputModel>> GetTrainings(AuthenticatedUser user, Guid? groupId, CancellationToken cancellationToken)
    {
        EnsureCoach(user, "Получать тренировки может только тренер.");

        var trainings = dbContext.Trainings
            .AsNoTracking()
            .Where(training => training.Coach.UserId == user.Id);

        if (groupId.HasValue)
        {
            trainings = trainings.Where(training => training.GroupId == groupId.Value);
        }

        return await trainings
            .OrderBy(training => training.Time)
            .Select(training => new TrainingOutputModel
            {
                Id = training.Id,
                GroupId = training.GroupId,
                GroupName = training.Group.Name,
                Description = training.Description,
                Time = training.Time
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<TrainingOutputModel> CreateTraining(CreateTrainingInputModel inputModel, AuthenticatedUser user, CancellationToken cancellationToken)
    {
        EnsureCoach(user, "Создавать тренировки может только тренер.");

        if (inputModel.GroupId == Guid.Empty)
        {
            throw new ArgumentException("Необходимо выбрать группу.", nameof(inputModel.GroupId));
        }

        var description = string.IsNullOrWhiteSpace(inputModel.Description)
            ? null
            : inputModel.Description.Trim();

        if (description?.Length > 300)
        {
            throw new ArgumentException("Описание тренировки не должно превышать 300 символов.", nameof(inputModel.Description));
        }

        if (inputModel.Time == default)
        {
            throw new ArgumentException("Необходимо указать дату и время тренировки.", nameof(inputModel.Time));
        }

        var group = await dbContext.CoachGroups
            .AsNoTracking()
            .Where(coachGroup => coachGroup.GroupId == inputModel.GroupId && coachGroup.Coach.UserId == user.Id)
            .Select(coachGroup => new
            {
                coachGroup.CoachId,
                coachGroup.GroupId,
                coachGroup.Group.Name
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (group is null)
        {
            throw new InvalidOperationException("Выбранная группа не принадлежит текущему тренеру.");
        }

        var training = new Training
        {
            Id = Guid.NewGuid(),
            CoachId = group.CoachId,
            GroupId = group.GroupId,
            Description = description,
            Time = DateTime.SpecifyKind(inputModel.Time, DateTimeKind.Unspecified)
        };

        dbContext.Trainings.Add(training);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new TrainingOutputModel
        {
            Id = training.Id,
            GroupId = training.GroupId,
            GroupName = group.Name,
            Description = training.Description,
            Time = training.Time
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
