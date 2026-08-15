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
        var description = ValidateTrainingInput(inputModel.GroupId, inputModel.Description, inputModel.StartTime, inputModel.EndTime);

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

    public async Task<TrainingOutputModel> UpdateTraining(
        Guid trainingId,
        UpdateTrainingInputModel inputModel,
        AuthenticatedUser user,
        CancellationToken cancellationToken)
    {
        EnsureCoach(user, "Редактировать тренировки может только тренер.");

        if (trainingId == Guid.Empty)
        {
            throw new ArgumentException("Необходимо указать тренировку.", nameof(trainingId));
        }

        var description = ValidateTrainingInput(inputModel.GroupId, inputModel.Description, inputModel.StartTime, inputModel.EndTime);
        var training = await dbContext.Trainings
            .Include(currentTraining => currentTraining.Coach)
            .SingleOrDefaultAsync(currentTraining => currentTraining.Id == trainingId, cancellationToken);

        if (training is null)
        {
            throw new InvalidOperationException("Тренировка не найдена.");
        }

        if (training.Coach.UserId != user.Id)
        {
            throw new UnauthorizedAccessException("Тренировка не принадлежит текущему тренеру.");
        }

        var group = await dbContext.CoachGroups
            .AsNoTracking()
            .Where(coachGroup => coachGroup.GroupId == inputModel.GroupId && coachGroup.Coach.UserId == user.Id)
            .Select(coachGroup => new
            {
                coachGroup.GroupId,
                coachGroup.Group.Name,
                coachGroup.Group.ColorId,
                ColorName = coachGroup.Group.Color.Name
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (group is null)
        {
            throw new ArgumentException("Выбранная группа не принадлежит текущему тренеру.", nameof(inputModel.GroupId));
        }

        training.GroupId = group.GroupId;
        training.Description = description;
        training.StartTime = DateTime.SpecifyKind(inputModel.StartTime, DateTimeKind.Unspecified);
        training.EndTime = DateTime.SpecifyKind(inputModel.EndTime, DateTimeKind.Unspecified);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Тренировка отредактирована. UserId: {UserId} | TrainingId: {TrainingId} | GroupId: {GroupId}", user.Id, training.Id, training.GroupId);
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

    private static string? ValidateTrainingInput(Guid groupId, string? inputDescription, DateTime startTime, DateTime endTime)
    {
        if (groupId == Guid.Empty)
        {
            throw new ArgumentException("Необходимо выбрать группу.", nameof(groupId));
        }

        var description = string.IsNullOrWhiteSpace(inputDescription) ? null : inputDescription.Trim();
        if (description?.Length > 300)
        {
            throw new ArgumentException("Описание тренировки не должно превышать 300 символов.", nameof(inputDescription));
        }

        if (startTime == default)
        {
            throw new ArgumentException("Необходимо указать дату и время начала тренировки.", nameof(startTime));
        }

        if (endTime == default)
        {
            throw new ArgumentException("Необходимо указать дату и время окончания тренировки.", nameof(endTime));
        }

        if (endTime <= startTime)
        {
            throw new ArgumentException("Время окончания тренировки должно быть позже времени начала.", nameof(endTime));
        }

        return description;
    }
}
