using JiuDiary.Api.Auth;
using JiuDiary.Database;
using JiuDiary.Database.Entities;
using JiuDiary.Database.Enums;
using JiuDiary.Models.Training;
using JiraDiary.AspCore.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.Services;

public sealed class TrainingService(JiuDiaryDbContext dbContext, ILogger<TrainingService> logger)
{
    public async Task<List<TrainingOutputModel>> GetTrainings(AuthenticatedUser user, Guid? groupId, CancellationToken cancellationToken)
    {
        IQueryable<Training> trainings;
        if (user.Role == UserRolesEnum.Coach)
        {
            trainings = dbContext.Trainings
                .AsNoTracking()
                .Where(training => training.Coach.UserId == user.Id);
        }
        else if (user.Role == UserRolesEnum.Student)
        {
            trainings = dbContext.Trainings
                .AsNoTracking()
                .Where(training => training.Group.StudentGroups.Any(studentGroup => studentGroup.Student.UserId == user.Id));
        }
        else
        {
            throw new UnauthorizedAccessException("Получать тренировки может только тренер или ученик.");
        }

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

        logger.LogInformation("Тренировки пользователя получены. UserId: {UserId} | Role: {Role} | Count: {Count}", user.Id, user.Role, result.Count);
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
            throw new AspNetException("Выбранная группа не принадлежит текущему тренеру.", StatusCodes.Status403Forbidden);
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
            throw new AspNetException("Необходимо указать тренировку.", StatusCodes.Status400BadRequest);
        }

        var description = ValidateTrainingInput(inputModel.GroupId, inputModel.Description, inputModel.StartTime, inputModel.EndTime);
        var training = await dbContext.Trainings
            .Include(currentTraining => currentTraining.Coach)
            .SingleOrDefaultAsync(currentTraining => currentTraining.Id == trainingId, cancellationToken);

        if (training is null)
        {
            throw new AspNetException("Тренировка не найдена.", StatusCodes.Status404NotFound);
        }

        if (training.Coach.UserId != user.Id)
        {
            throw new AspNetException("Тренировка не принадлежит текущему тренеру.", StatusCodes.Status403Forbidden);
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
            throw new AspNetException("Выбранная группа не принадлежит текущему тренеру.", StatusCodes.Status400BadRequest);
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
            throw new AspNetException("Необходимо указать тренировку.", StatusCodes.Status400BadRequest);
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
            throw new AspNetException("Тренировка не найдена.", StatusCodes.Status404NotFound);
        }

        if (training.UserId != user.Id)
        {
            throw new AspNetException("Тренировка не принадлежит текущему тренеру.", StatusCodes.Status403Forbidden);
        }

        dbContext.Trainings.Remove(training.Entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Тренировка удалена. UserId: {UserId} | TrainingId: {TrainingId}", user.Id, trainingId);
    }

    private static void EnsureCoach(AuthenticatedUser user, string message)
    {
        if (user.Role != UserRolesEnum.Coach)
        {
            throw new AspNetException(message, StatusCodes.Status403Forbidden);
        }
    }

    private static string? ValidateTrainingInput(Guid groupId, string? inputDescription, DateTime startTime, DateTime endTime)
    {
        if (groupId == Guid.Empty)
        {
            throw new AspNetException("Необходимо выбрать группу.", StatusCodes.Status400BadRequest);
        }

        var description = string.IsNullOrWhiteSpace(inputDescription) ? null : inputDescription.Trim();
        if (description?.Length > 300)
        {
            throw new AspNetException("Описание тренировки не должно превышать 300 символов.", StatusCodes.Status400BadRequest);
        }

        if (startTime == default)
        {
            throw new AspNetException("Необходимо указать дату и время начала тренировки.", StatusCodes.Status400BadRequest);
        }

        if (endTime == default)
        {
            throw new AspNetException("Необходимо указать дату и время окончания тренировки.", StatusCodes.Status400BadRequest);
        }

        if (endTime <= startTime)
        {
            throw new AspNetException("Время окончания тренировки должно быть позже времени начала.", StatusCodes.Status400BadRequest);
        }

        return description;
    }
}
