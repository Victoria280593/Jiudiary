using JiuDiary.Database;
using JiuDiary.Database.Entities;
using JiuDiary.Database.Enums;
using JiuDiary.Api.Auth;
using JiuDiary.Extensions;
using JiuDiary.Extensions.Models;
using JiuDiary.Models.Trainer;
using JiraDiary.AspCore.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.Services;

public sealed class TrainerService(JiuDiaryDbContext dbContext)
{
    /// <summary>
    /// Получает доступных для подачи заявки тренеров, исключая уже прикреплённых к ученику.
    /// </summary>
    public Task<PagedResult<TrainerOutputModel>> GetTrainersAsync(AuthenticatedUser student, Filter filter, CancellationToken cancellationToken)
    {
        EnsureRole(student, UserRolesEnum.Student);
        var trainers = dbContext.Users
            .AsNoTracking()
            .Where(user => user.IsActive && user.RoleId == (int)UserRolesEnum.Coach && !user.Students.Any(item => item.StudentId == student.Id))
            .ApplySearch(
                filter.Search,
                search => user => (user.ClientInfo != null &&
                                  (user.ClientInfo.FirstName.Contains(search) ||
                                   user.ClientInfo.LastName.Contains(search) ||
                                   (user.ClientInfo.MiddleName != null && user.ClientInfo.MiddleName.Contains(search)))) ||
                                  user.Login.Contains(search))
            .OrderBy(user => user.ClientInfo == null ? "" : user.ClientInfo.LastName)
            .ThenBy(user => user.ClientInfo == null ? "" : user.ClientInfo.FirstName)
            .ThenBy(user => user.ClientInfo == null ? "" : user.ClientInfo.MiddleName)
            .ThenBy(user => user.Login)
            .Select(user => new TrainerOutputModel
            {
                Id = user.Id,
                Name = user.ClientInfo == null
                    ? user.Login
                    : user.ClientInfo.LastName + " " + user.ClientInfo.FirstName + (user.ClientInfo.MiddleName == null || user.ClientInfo.MiddleName == "" ? "" : " " + user.ClientInfo.MiddleName),
                Login = user.Login,
                BeltId = user.ClientInfo == null ? null : user.ClientInfo.BeltId,
                BeltName = user.ClientInfo == null || user.ClientInfo.Belt == null
                    ? null
                    : user.ClientInfo.Belt.Name
            });

        return trainers.ToPagedResultAsync(filter, cancellationToken);
    }

    public async Task<StudentRequestOutputModel> CreateStudentRequestAsync(AuthenticatedUser student, Guid coachId, CancellationToken cancellationToken)
    {
        EnsureRole(student, UserRolesEnum.Student);

        var coachExists = await dbContext.Users.AnyAsync(
            user => user.Id == coachId && user.IsActive && user.RoleId == (int)UserRolesEnum.Coach,
            cancellationToken);
        if (!coachExists)
        {
            throw new AspNetException("Тренер не найден.", StatusCodes.Status404NotFound);
        }

        var isAlreadyStudent = await dbContext.CoachStudents.AnyAsync(
            item => item.StudentId == student.Id && item.CoachId == coachId,
            cancellationToken);
        if (isAlreadyStudent)
        {
            throw new AspNetException("Вы уже являетесь учеником этого тренера.", StatusCodes.Status409Conflict);
        }

        var hasActiveRequest = await dbContext.StudentsRequests.AnyAsync(
            request => request.StudentId == student.Id &&
                       request.CoachId == coachId &&
                       !request.IsDeleted, cancellationToken);
        if (hasActiveRequest)
        {
            throw new AspNetException("Заявка этому тренеру уже отправлена или уже принята.", StatusCodes.Status409Conflict);
        }

        var request = new StudentRequest
        {
            Id = Guid.NewGuid(),
            StudentId = student.Id,
            CoachId = coachId,
            Status = StudentRequestStatusEnum.Pending,
            CreateDate = DateTime.Now,
            IsDeleted = false
        };

        dbContext.StudentsRequests.Add(request);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await StudentRequestsQuery()
            .SingleAsync(item => item.Id == request.Id, cancellationToken);
    }

    public Task<List<StudentRequestOutputModel>> GetStudentRequestsAsync(AuthenticatedUser student, CancellationToken cancellationToken)
    {
        EnsureRole(student, UserRolesEnum.Student);
        return StudentRequestsQuery(includeDeleted: false)
            .Where(request => request.StudentId == student.Id)
            .OrderByDescending(request => request.CreateDate)
            .ToListAsync(cancellationToken);
    }

    public Task<List<TrainerOutputModel>> GetStudentTrainersAsync(AuthenticatedUser student, CancellationToken cancellationToken)
    {
        EnsureRole(student, UserRolesEnum.Student);
        return dbContext.CoachStudents
            .AsNoTracking()
            .Where(item => item.StudentId == student.Id)
            .OrderBy(item => item.Coach.ClientInfo == null ? "" : item.Coach.ClientInfo.LastName)
            .ThenBy(item => item.Coach.ClientInfo == null ? "" : item.Coach.ClientInfo.FirstName)
            .Select(item => new TrainerOutputModel
            {
                Id = item.Coach.Id,
                Name = item.Coach.ClientInfo == null
                    ? item.Coach.Login
                    : item.Coach.ClientInfo.LastName + " " + item.Coach.ClientInfo.FirstName + (item.Coach.ClientInfo.MiddleName == null || item.Coach.ClientInfo.MiddleName == "" ? "" : " " + item.Coach.ClientInfo.MiddleName),
                Login = item.Coach.Login,
                BeltId = item.Coach.ClientInfo == null ? null : item.Coach.ClientInfo.BeltId,
                BeltName = item.Coach.ClientInfo == null || item.Coach.ClientInfo.Belt == null
                    ? null
                    : item.Coach.ClientInfo.Belt.Name
            })
            .ToListAsync(cancellationToken);
    }

    public Task<List<StudentRequestOutputModel>> GetCoachRequestsAsync(AuthenticatedUser coach, CancellationToken cancellationToken)
    {
        EnsureRole(coach, UserRolesEnum.Coach);
        return StudentRequestsQuery(includeDeleted: false)
            .Where(request => request.CoachId == coach.Id &&
                              (request.Status == StudentRequestStatusEnum.Pending ||
                               request.Status == StudentRequestStatusEnum.Rejected))
            .OrderByDescending(request => request.CreateDate)
            .ToListAsync(cancellationToken);
    }

    public Task<List<StudentOutputModel>> GetCoachStudentsAsync(AuthenticatedUser coach, CancellationToken cancellationToken)
    {
        EnsureRole(coach, UserRolesEnum.Coach);
        return dbContext.CoachStudents
            .AsNoTracking()
            .Where(item => item.CoachId == coach.Id)
            .OrderBy(item => item.Student.ClientInfo == null ? "" : item.Student.ClientInfo.LastName)
            .ThenBy(item => item.Student.ClientInfo == null ? "" : item.Student.ClientInfo.FirstName)
            .Select(item => new StudentOutputModel
            {
                Id = item.Student.Id,
                Name = item.Student.ClientInfo == null
                    ? item.Student.Login
                    : item.Student.ClientInfo.LastName + " " + item.Student.ClientInfo.FirstName + (item.Student.ClientInfo.MiddleName == null || item.Student.ClientInfo.MiddleName == "" ? "" : " " + item.Student.ClientInfo.MiddleName),
                Login = item.Student.Login,
                BeltId = item.Student.ClientInfo == null ? null : item.Student.ClientInfo.BeltId,
                BeltName = item.Student.ClientInfo == null || item.Student.ClientInfo.Belt == null
                    ? null
                    : item.Student.ClientInfo.Belt.Name,
                Groups = item.Student.ClientInfo == null
                    ? new List<StudentGroupOutputModel>()
                    : item.Student.ClientInfo.StudentGroups
                        .Where(studentGroup => studentGroup.Group.CoachGroups.Any(coachGroup => coachGroup.Coach.UserId == coach.Id))
                        .OrderBy(studentGroup => studentGroup.Group.Name)
                        .Select(studentGroup => new StudentGroupOutputModel
                        {
                            Id = studentGroup.GroupId,
                            Name = studentGroup.Group.Name,
                            ColorName = studentGroup.Group.Color.Name
                        })
                        .ToList()
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<StudentRequestOutputModel> ResolveStudentRequestAsync(AuthenticatedUser coach, Guid requestId, StudentRequestStatusEnum status, CancellationToken cancellationToken)
    {
        EnsureRole(coach, UserRolesEnum.Coach);
        if (status is not (StudentRequestStatusEnum.Accepted or StudentRequestStatusEnum.Rejected))
        {
            throw new AspNetException("Заявку можно только принять или отклонить.", StatusCodes.Status400BadRequest);
        }

        var request = await dbContext.StudentsRequests.SingleOrDefaultAsync(
            item => item.Id == requestId &&
                    item.CoachId == coach.Id &&
                    !item.IsDeleted &&
                    (item.Status == StudentRequestStatusEnum.Pending ||
                     item.Status == StudentRequestStatusEnum.Rejected),
            cancellationToken);
        if (request is null)
        {
            throw new AspNetException("Заявка не найдена.", StatusCodes.Status404NotFound);
        }

        if (status == StudentRequestStatusEnum.Accepted)
        {
            var acceptedRequest = await StudentRequestsQuery()
                .SingleAsync(item => item.Id == request.Id, cancellationToken);
            acceptedRequest.Status = StudentRequestStatusEnum.Accepted;

            var linkExists = await dbContext.CoachStudents.AnyAsync(
                item => item.CoachId == coach.Id && item.StudentId == request.StudentId,
                cancellationToken);
            if (!linkExists)
            {
                dbContext.CoachStudents.Add(new CoachStudent
                {
                    Id = Guid.NewGuid(),
                    CoachId = coach.Id,
                    StudentId = request.StudentId,
                    CreateDate = DateTime.Now
                });
            }

            dbContext.StudentsRequests.Remove(request);
            await dbContext.SaveChangesAsync(cancellationToken);
            return acceptedRequest;
        }

        request.Status = StudentRequestStatusEnum.Rejected;
        request.IsDeleted = false;

        await dbContext.SaveChangesAsync(cancellationToken);

        return await StudentRequestsQuery()
            .SingleAsync(item => item.Id == request.Id, cancellationToken);
    }

    public async Task<bool> DeleteStudentRequestAsync(AuthenticatedUser user, Guid requestId, CancellationToken cancellationToken)
    {
        if (user.Role is not (UserRolesEnum.Coach or UserRolesEnum.Student))
        {
            throw new AspNetException("Удалить заявку может только тренер или ученик.", StatusCodes.Status403Forbidden);
        }

        var request = await dbContext.StudentsRequests.SingleOrDefaultAsync(
            item => item.Id == requestId &&
                    !item.IsDeleted &&
                    ((user.Role == UserRolesEnum.Coach && item.CoachId == user.Id) ||
                     (user.Role == UserRolesEnum.Student && item.StudentId == user.Id)),
            cancellationToken);
        if (request is null)
        {
            return false;
        }

        request.IsDeleted = true;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RemoveCoachStudentAsync(AuthenticatedUser coach, Guid studentId, CancellationToken cancellationToken)
    {
        EnsureRole(coach, UserRolesEnum.Coach);
        return await RemoveCoachStudentLinkAsync(coach.Id, studentId, cancellationToken);
    }

    /// <summary>
    /// Открепляет текущего ученика от тренера и удаляет назначения в его группы.
    /// </summary>
    public async Task<bool> RemoveStudentTrainerAsync(AuthenticatedUser student, Guid coachId, CancellationToken cancellationToken)
    {
        EnsureRole(student, UserRolesEnum.Student);
        return await RemoveCoachStudentLinkAsync(coachId, student.Id, cancellationToken);
    }

    private async Task<bool> RemoveCoachStudentLinkAsync(Guid coachId, Guid studentId, CancellationToken cancellationToken)
    {
        var links = await dbContext.CoachStudents
            .Where(item => item.CoachId == coachId && item.StudentId == studentId)
            .ToListAsync(cancellationToken);
        if (links.Count == 0)
        {
            return false;
        }

        var studentClientInfoId = await dbContext.ClientInfos
            .AsNoTracking()
            .Where(item => item.UserId == studentId)
            .Select(item => (Guid?)item.Id)
            .SingleOrDefaultAsync(cancellationToken);
        if (studentClientInfoId.HasValue)
        {
            var coachGroupIds = dbContext.CoachGroups
                .Where(item => item.Coach.UserId == coachId)
                .Select(item => item.GroupId);
            var assignments = await dbContext.StudentGroups
                .Where(item => item.StudentId == studentClientInfoId.Value && coachGroupIds.Contains(item.GroupId))
                .ToListAsync(cancellationToken);
            dbContext.StudentGroups.RemoveRange(assignments);
        }

        var requests = await dbContext.StudentsRequests
            .Where(item => item.CoachId == coachId && item.StudentId == studentId)
            .ToListAsync(cancellationToken);
        dbContext.StudentsRequests.RemoveRange(requests);

        dbContext.CoachStudents.RemoveRange(links);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<List<StudentGroupOutputModel>> UpdateCoachStudentGroupsAsync(
        AuthenticatedUser coach,
        Guid studentId,
        UpdateStudentGroupsInputModel inputModel,
        CancellationToken cancellationToken)
    {
        EnsureRole(coach, UserRolesEnum.Coach);

        var studentClientInfoId = await dbContext.CoachStudents
            .AsNoTracking()
            .Where(item => item.CoachId == coach.Id && item.StudentId == studentId)
            .Select(item => item.Student.ClientInfo == null ? (Guid?)null : item.Student.ClientInfo.Id)
            .SingleOrDefaultAsync(cancellationToken);
        if (!studentClientInfoId.HasValue)
        {
            throw new AspNetException("Ученик не найден или его профиль не заполнен.", StatusCodes.Status404NotFound);
        }

        var coachGroupIds = await dbContext.CoachGroups
            .AsNoTracking()
            .Where(item => item.Coach.UserId == coach.Id)
            .Select(item => item.GroupId)
            .ToListAsync(cancellationToken);
        var requestedGroupIds = inputModel.GroupIds.Distinct().ToList();
        if (requestedGroupIds.Except(coachGroupIds).Any())
        {
            throw new AspNetException("Можно назначить только группы текущего тренера.", StatusCodes.Status400BadRequest);
        }

        var existingAssignments = await dbContext.StudentGroups
            .Where(item => item.StudentId == studentClientInfoId.Value && coachGroupIds.Contains(item.GroupId))
            .ToListAsync(cancellationToken);
        dbContext.StudentGroups.RemoveRange(existingAssignments.Where(item => !requestedGroupIds.Contains(item.GroupId)));

        var existingGroupIds = existingAssignments.Select(item => item.GroupId).ToHashSet();
        foreach (var groupId in requestedGroupIds.Where(groupId => !existingGroupIds.Contains(groupId)))
        {
            dbContext.StudentGroups.Add(new StudentGroup
            {
                StudentId = studentClientInfoId.Value,
                GroupId = groupId
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return await dbContext.StudentGroups
            .AsNoTracking()
            .Where(item => item.StudentId == studentClientInfoId.Value && coachGroupIds.Contains(item.GroupId))
            .OrderBy(item => item.Group.Name)
            .Select(item => new StudentGroupOutputModel
            {
                Id = item.GroupId,
                Name = item.Group.Name,
                ColorName = item.Group.Color.Name
            })
            .ToListAsync(cancellationToken);
    }

    private IQueryable<StudentRequestOutputModel> StudentRequestsQuery(bool includeDeleted = true)
    {
        var requests = dbContext.StudentsRequests.AsNoTracking();
        if (!includeDeleted)
        {
            requests = requests.Where(request => !request.IsDeleted);
        }

        return requests.Select(request => new StudentRequestOutputModel
            {
                Id = request.Id,
                StudentId = request.StudentId,
                StudentName = request.Student.ClientInfo == null
                    ? request.Student.Login
                    : request.Student.ClientInfo.LastName + " " + request.Student.ClientInfo.FirstName + (request.Student.ClientInfo.MiddleName == null || request.Student.ClientInfo.MiddleName == "" ? "" : " " + request.Student.ClientInfo.MiddleName),
                StudentLogin = request.Student.Login,
                CoachId = request.CoachId,
                CoachName = request.Coach.ClientInfo == null
                    ? request.Coach.Login
                    : request.Coach.ClientInfo.LastName + " " + request.Coach.ClientInfo.FirstName + (request.Coach.ClientInfo.MiddleName == null || request.Coach.ClientInfo.MiddleName == "" ? "" : " " + request.Coach.ClientInfo.MiddleName),
                CoachLogin = request.Coach.Login,
                Status = request.Status,
                CreateDate = request.CreateDate
            });
    }

    private static void EnsureRole(AuthenticatedUser user, UserRolesEnum role)
    {
        if (user.Role != role)
        {
            throw new AspNetException("Недостаточно прав для выполнения операции.", StatusCodes.Status403Forbidden);
        }
    }
}
