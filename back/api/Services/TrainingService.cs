using JiuDiary.Api.Auth;
using JiuDiary.Database;
using JiuDiary.Database.Entities;
using JiuDiary.Database.Enums;
using JiuDiary.Models.ClientTraining;
using JiuDiary.Models.Training;
using JiraDiary.AspCore.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.Services;

public sealed class TrainingService(JiuDiaryDbContext dbContext, ILogger<TrainingService> logger)
{
    /// <summary>
    /// Создаёт или обновляет отметку текущего клиента о доступной ему тренировке.
    /// </summary>
    public async Task<ClientTrainingOutputModel> SaveClientTraining(Guid trainingId, SaveClientTrainingInputModel inputModel, AuthenticatedUser user, CancellationToken cancellationToken)
    {
        EnsureClientTrainingRole(user);
        if (trainingId == Guid.Empty)
        {
            throw new AspNetException("Необходимо указать тренировку.", StatusCodes.Status400BadRequest);
        }

        if (inputModel.Rounds < 0)
        {
            throw new AspNetException("Количество раундов не может быть отрицательным.", StatusCodes.Status400BadRequest);
        }

        var clientInfoId = await GetCurrentClientInfoId(user, cancellationToken);
        if (!await GetAccessibleTrainings(user).AnyAsync(training => training.Id == trainingId, cancellationToken))
        {
            throw new AspNetException("Тренировка не найдена или недоступна.", StatusCodes.Status404NotFound);
        }

        var clientTraining = await dbContext.ClientTrainings
            .Include(item => item.Submissions)
            .ThenInclude(item => item.Submission)
            .SingleOrDefaultAsync(item => item.ClientInfoId == clientInfoId && item.TrainingId == trainingId, cancellationToken);
        if (clientTraining is null)
        {
            clientTraining = new ClientTraining
            {
                ClientInfoId = clientInfoId,
                TrainingId = trainingId,
                Rounds = inputModel.Rounds
            };
            dbContext.ClientTrainings.Add(clientTraining);
        }
        else
        {
            clientTraining.Rounds = inputModel.Rounds;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Отметка о тренировке клиента сохранена. UserId: {UserId} | TrainingId: {TrainingId} | Rounds: {Rounds}", user.Id, trainingId, inputModel.Rounds);

        return new ClientTrainingOutputModel
        {
            Id = clientTraining.Id,
            TrainingId = clientTraining.TrainingId,
            Rounds = clientTraining.Rounds,
            Submissions = clientTraining.Submissions.OrderBy(item => item.SubmissionId).Select(ToOutputModel).ToList(),
            CreatedAt = clientTraining.CreatedAt
        };
    }

    /// <summary>
    /// Добавляет приём к отметке текущего клиента о тренировке с начальным количеством один.
    /// </summary>
    /// <param name="trainingId">Идентификатор доступной клиенту тренировки.</param>
    /// <param name="inputModel">Идентификатор добавляемого приёма.</param>
    /// <param name="user">Текущий авторизованный пользователь.</param>
    /// <param name="cancellationToken">Токен отмены операции.</param>
    /// <returns>Добавленный приём с русским и английским названиями.</returns>
    public async Task<ClientTrainingSubmissionOutputModel> AddClientTrainingSubmission(Guid trainingId, AddClientTrainingSubmissionInputModel inputModel, AuthenticatedUser user, CancellationToken cancellationToken)
    {
        EnsureClientTrainingRole(user);
        if (trainingId == Guid.Empty || inputModel.SubmissionId <= 0)
        {
            throw new AspNetException("Необходимо указать тренировку и приём.", StatusCodes.Status400BadRequest);
        }

        var clientInfoId = await GetCurrentClientInfoId(user, cancellationToken);
        if (!await GetAccessibleTrainings(user).AnyAsync(training => training.Id == trainingId, cancellationToken))
        {
            throw new AspNetException("Тренировка не найдена или недоступна.", StatusCodes.Status404NotFound);
        }

        var submission = await dbContext.Submissions.AsNoTracking().SingleOrDefaultAsync(item => item.Id == inputModel.SubmissionId, cancellationToken);
        if (submission is null)
        {
            throw new AspNetException("Приём не найден.", StatusCodes.Status404NotFound);
        }

        var clientTraining = await dbContext.ClientTrainings
            .Include(item => item.Submissions)
            .SingleOrDefaultAsync(item => item.ClientInfoId == clientInfoId && item.TrainingId == trainingId, cancellationToken);

        if (clientTraining is null)
        {
            clientTraining = new ClientTraining
            {
                ClientInfoId = clientInfoId,
                TrainingId = trainingId,
                Rounds = 0
            };
            dbContext.ClientTrainings.Add(clientTraining);
        }

        if (clientTraining.Submissions.Any(item => item.SubmissionId == inputModel.SubmissionId))
        {
            throw new AspNetException("Этот приём уже добавлен к тренировке.", StatusCodes.Status409Conflict);
        }

        var clientTrainingSubmission = new ClientTrainingSubmission
        {
            ClientTraining = clientTraining,
            SubmissionId = submission.Id,
            Count = 1
        };
        dbContext.ClientTrainingSubmissions.Add(clientTrainingSubmission);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Приём добавлен к тренировке клиента. UserId: {UserId} | TrainingId: {TrainingId} | SubmissionId: {SubmissionId}", user.Id, trainingId, submission.Id);
        return new ClientTrainingSubmissionOutputModel { SubmissionId = submission.Id, NameRu = submission.NameRu, NameEn = submission.NameEn, Count = clientTrainingSubmission.Count };
    }

    /// <summary>
    /// Изменяет количество выбранного приёма в отметке текущего клиента о тренировке.
    /// </summary>
    /// <param name="trainingId">Идентификатор тренировки.</param>
    /// <param name="submissionId">Идентификатор приёма.</param>
    /// <param name="inputModel">Новое положительное количество выполнений.</param>
    /// <param name="user">Текущий авторизованный пользователь.</param>
    /// <param name="cancellationToken">Токен отмены операции.</param>
    /// <returns>Приём с обновлённым количеством.</returns>
    public async Task<ClientTrainingSubmissionOutputModel> UpdateClientTrainingSubmission(Guid trainingId, int submissionId, UpdateClientTrainingSubmissionInputModel inputModel, AuthenticatedUser user, CancellationToken cancellationToken)
    {
        EnsureClientTrainingRole(user);
        if (trainingId == Guid.Empty || submissionId <= 0 || inputModel.Count <= 0)
        {
            throw new AspNetException("Количество приёмов должно быть больше нуля.", StatusCodes.Status400BadRequest);
        }

        var clientInfoId = await GetCurrentClientInfoId(user, cancellationToken);
        var clientTrainingSubmission = await dbContext.ClientTrainingSubmissions
            .Include(item => item.Submission)
            .SingleOrDefaultAsync(item =>
                item.ClientTraining.ClientInfoId == clientInfoId &&
                item.ClientTraining.TrainingId == trainingId &&
                item.SubmissionId == submissionId,
                cancellationToken);

        if (clientTrainingSubmission is null)
        {
            throw new AspNetException("Приём не найден в отметке о тренировке.", StatusCodes.Status404NotFound);
        }

        clientTrainingSubmission.Count = inputModel.Count;
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Количество приёмов изменено. UserId: {UserId} | TrainingId: {TrainingId} | SubmissionId: {SubmissionId} | Count: {Count}", user.Id, trainingId, submissionId, inputModel.Count);
        return ToOutputModel(clientTrainingSubmission);
    }

    /// <summary>
    /// Удаляет выбранный приём из отметки текущего клиента о тренировке.
    /// </summary>
    /// <param name="trainingId">Идентификатор тренировки.</param>
    /// <param name="submissionId">Идентификатор удаляемого приёма.</param>
    /// <param name="user">Текущий авторизованный пользователь.</param>
    /// <param name="cancellationToken">Токен отмены операции.</param>
    public async Task DeleteClientTrainingSubmission(Guid trainingId, int submissionId, AuthenticatedUser user, CancellationToken cancellationToken)
    {
        EnsureClientTrainingRole(user);
        if (trainingId == Guid.Empty || submissionId <= 0)
        {
            throw new AspNetException("Необходимо указать тренировку и приём.", StatusCodes.Status400BadRequest);
        }

        var clientInfoId = await GetCurrentClientInfoId(user, cancellationToken);
        var clientTrainingSubmission = await dbContext.ClientTrainingSubmissions.SingleOrDefaultAsync(item =>
            item.ClientTraining.ClientInfoId == clientInfoId &&
            item.ClientTraining.TrainingId == trainingId &&
            item.SubmissionId == submissionId,
            cancellationToken);

        if (clientTrainingSubmission is null)
        {
            throw new AspNetException("Приём не найден в отметке о тренировке.", StatusCodes.Status404NotFound);
        }

        dbContext.ClientTrainingSubmissions.Remove(clientTrainingSubmission);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Приём удалён из тренировки клиента. UserId: {UserId} | TrainingId: {TrainingId} | SubmissionId: {SubmissionId}", user.Id, trainingId, submissionId);
    }

    /// <summary>
    /// Получает доступные пользователю тренировки вместе с его отметками.
    /// </summary>
    public async Task<List<TrainingOutputModel>> GetTrainings(AuthenticatedUser user, IReadOnlyCollection<Guid>? groupIds, CancellationToken cancellationToken)
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
            throw new AspNetException("Получать тренировки может только тренер или ученик.", StatusCodes.Status403Forbidden);
        }

        if (groupIds is { Count: > 0 })
        {
            trainings = trainings.Where(training => groupIds.Contains(training.GroupId));
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
                EndTime = training.EndTime,
                ClientTraining = training.ClientTrainings
                    .Where(clientTraining => clientTraining.ClientInfo.UserId == user.Id)
                    .Select(clientTraining => new ClientTrainingOutputModel
                    {
                        Id = clientTraining.Id,
                        TrainingId = clientTraining.TrainingId,
                        Rounds = clientTraining.Rounds,
                        Submissions = clientTraining.Submissions
                            .OrderBy(item => item.SubmissionId)
                            .Select(item => new ClientTrainingSubmissionOutputModel
                            {
                                SubmissionId = item.SubmissionId,
                                NameRu = item.Submission.NameRu,
                                NameEn = item.Submission.NameEn,
                                Count = item.Count
                            })
                            .ToList(),
                        CreatedAt = clientTraining.CreatedAt
                    })
                    .FirstOrDefault()
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

        var trainings = new List<Training> { training };
        if (inputModel.RepeatEveryWeek)
        {
            var nextYearStart = new DateTime(training.StartTime.Year + 1, 1, 1);
            var repeatedStartTime = training.StartTime.AddDays(7);
            var repeatedEndTime = training.EndTime.AddDays(7);

            while (repeatedStartTime < nextYearStart)
            {
                trainings.Add(new Training
                {
                    Id = Guid.NewGuid(),
                    CoachId = group.CoachId,
                    GroupId = group.GroupId,
                    Description = null,
                    StartTime = repeatedStartTime,
                    EndTime = repeatedEndTime
                });

                repeatedStartTime = repeatedStartTime.AddDays(7);
                repeatedEndTime = repeatedEndTime.AddDays(7);
            }
        }

        dbContext.Trainings.AddRange(trainings);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            "Тренировка создана. UserId: {UserId} | GroupId: {GroupId} | TrainingId: {TrainingId} | TrainingsCreated: {TrainingsCreated}",
            user.Id,
            training.GroupId,
            training.Id,
            trainings.Count);

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

    public async Task DeleteTraining(
        Guid trainingId,
        bool deleteAllAfterThis,
        AuthenticatedUser user,
        CancellationToken cancellationToken)
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

        var trainingsToDelete = new List<Training> { training.Entity };
        if (deleteAllAfterThis)
        {
            var laterTrainings = await dbContext.Trainings
                .Where(candidate =>
                    candidate.Id != training.Entity.Id &&
                    candidate.CoachId == training.Entity.CoachId &&
                    candidate.GroupId == training.Entity.GroupId &&
                    candidate.StartTime >= training.Entity.StartTime)
                .ToListAsync(cancellationToken);

            trainingsToDelete.AddRange(laterTrainings.Where(candidate =>
                candidate.StartTime.DayOfWeek == training.Entity.StartTime.DayOfWeek &&
                candidate.StartTime.TimeOfDay == training.Entity.StartTime.TimeOfDay));
        }

        dbContext.Trainings.RemoveRange(trainingsToDelete);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            "Тренировка удалена. UserId: {UserId} | TrainingId: {TrainingId} | DeleteAllAfterThis: {DeleteAllAfterThis} | TrainingsDeleted: {TrainingsDeleted}",
            user.Id,
            trainingId,
            deleteAllAfterThis,
            trainingsToDelete.Count);
    }

    private static void EnsureCoach(AuthenticatedUser user, string message)
    {
        if (user.Role != UserRolesEnum.Coach)
        {
            throw new AspNetException(message, StatusCodes.Status403Forbidden);
        }
    }

    private IQueryable<Training> GetAccessibleTrainings(AuthenticatedUser user)
    {
        return user.Role switch
        {
            UserRolesEnum.Coach => dbContext.Trainings.Where(training => training.Coach.UserId == user.Id),
            UserRolesEnum.Student => dbContext.Trainings.Where(training => training.Group.StudentGroups.Any(studentGroup => studentGroup.Student.UserId == user.Id)),
            _ => throw new AspNetException("Отмечать тренировки может только тренер или ученик.", StatusCodes.Status403Forbidden)
        };
    }

    private async Task<Guid> GetCurrentClientInfoId(AuthenticatedUser user, CancellationToken cancellationToken)
    {
        var clientInfoId = await dbContext.ClientInfos.AsNoTracking().Where(clientInfo => clientInfo.UserId == user.Id).Select(clientInfo => (Guid?)clientInfo.Id).SingleOrDefaultAsync(cancellationToken);
        return clientInfoId ?? throw new AspNetException("Профиль клиента не найден.", StatusCodes.Status404NotFound);
    }

    private static void EnsureClientTrainingRole(AuthenticatedUser user)
    {
        if (user.Role is not UserRolesEnum.Coach and not UserRolesEnum.Student)
        {
            throw new AspNetException("Отмечать тренировки может только тренер или ученик.", StatusCodes.Status403Forbidden);
        }
    }

    private static ClientTrainingSubmissionOutputModel ToOutputModel(ClientTrainingSubmission item) => new() { SubmissionId = item.SubmissionId, NameRu = item.Submission.NameRu, NameEn = item.Submission.NameEn, Count = item.Count };

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
