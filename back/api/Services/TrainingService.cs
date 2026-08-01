using JiuDiary.Api.Auth;
using JiuDiary.Database;
using JiuDiary.Database.Entities;
using JiuDiary.Database.Enums;
using JiuDiary.Models.Training;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.Services;

public sealed class TrainingService(JiuDiaryDbContext dbContext, ILogger<TrainingService> logger)
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

        var result = await trainings
            .OrderBy(training => training.StartTime)
            .Select(training => new TrainingOutputModel
            {
                Id = training.Id,
                GroupId = training.GroupId,
                GroupName = training.Group.Name,
                GroupColorId = training.Group.ColorId,
                GroupColorName = training.Group.Color.Name,
                Description = training.Description,
                StartTime = training.StartTime,
                EndTime = training.EndTime
            })
            .ToListAsync(cancellationToken);

        logger.LogInformation("Тренировки тренера получены. UserId: {UserId} | Count: {Count}", user.Id, result.Count);
        return result;
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

        if (inputModel.StartTime == default)
        {
            throw new ArgumentException("Необходимо указать дату и время начала тренировки.", nameof(inputModel.StartTime));
        }

        if (inputModel.EndTime == default)
        {
            throw new ArgumentException("Необходимо указать дату и время окончания тренировки.", nameof(inputModel.EndTime));
        }

        if (inputModel.EndTime <= inputModel.StartTime)
        {
            throw new ArgumentException("Время окончания тренировки должно быть позже времени начала.", nameof(inputModel.EndTime));
        }

        var group = await dbContext.CoachGroups
            .AsNoTracking()
            .Where(coachGroup => coachGroup.GroupId == inputModel.GroupId && coachGroup.Coach.UserId == user.Id)
            .Select(coachGroup => new
            {
                coachGroup.CoachId,
                coachGroup.GroupId,
                coachGroup.Group.Name,
                coachGroup.Group.ColorId,
                ColorName = coachGroup.Group.Color.Name
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
            StartTime = DateTime.SpecifyKind(inputModel.StartTime, DateTimeKind.Unspecified),
            EndTime = DateTime.SpecifyKind(inputModel.EndTime, DateTimeKind.Unspecified)
        };

        dbContext.Trainings.Add(training);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Тренировка создана. UserId: {UserId} | GroupId: {GroupId} | TrainingId: {TrainingId}", user.Id, training.GroupId, training.Id);

        return new TrainingOutputModel
        {
            Id = training.Id,
            GroupId = training.GroupId,
            GroupName = group.Name,
            GroupColorId = group.ColorId,
            GroupColorName = group.ColorName,
            Description = training.Description,
            StartTime = training.StartTime,
            EndTime = training.EndTime
        };
    }

    public async Task DeleteTraining(Guid trainingId, AuthenticatedUser user, CancellationToken cancellationToken)
    {
        EnsureCoach(user, "Удалять тренировки может только тренер.");

        if (trainingId == Guid.Empty)
        {
            throw new ArgumentException("Необходимо указать тренировку.", nameof(trainingId));
        }

        var training = await dbContext.Trainings
            .Where(training => training.Id == trainingId)
            .Select(training => new
            {
                Entity = training,
                training.Coach.UserId
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (training is null)
        {
            throw new InvalidOperationException("Тренировка не найдена.");
        }

        if (training.UserId != user.Id)
        {
            throw new UnauthorizedAccessException("Тренировка не принадлежит текущему тренеру.");
        }

        dbContext.Trainings.Remove(training.Entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Тренировка удалена. UserId: {UserId} | TrainingId: {TrainingId}", user.Id, trainingId);
    }

    private static void EnsureCoach(AuthenticatedUser user, string message)
    {
        if (user.Role != UserRolesEnum.Coach)
        {
            throw new UnauthorizedAccessException(message);
        }
    }
}
