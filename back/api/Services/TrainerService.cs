using JiuDiary.Database;
using JiuDiary.Database.Entities;
using JiuDiary.Database.Enums;
using JiuDiary.Api.Auth;
using JiuDiary.Extensions;
using JiuDiary.Extensions.Models;
using JiuDiary.Models.Trainer;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.Services;

public sealed class TrainerService(JiuDiaryDbContext dbContext)
{
    public Task<PagedResult<TrainerOutputModel>> GetTrainersAsync(Filter filter, CancellationToken cancellationToken)
    {
        var trainers = dbContext.Users
            .AsNoTracking()
            .Where(user => user.IsActive && user.RoleId == (int)UserRolesEnum.Coach)
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
            throw new KeyNotFoundException("Тренер не найден.");
        }

        var isAlreadyStudent = await dbContext.CoachStudents.AnyAsync(
            item => item.StudentId == student.Id && item.CoachId == coachId,
            cancellationToken);
        if (isAlreadyStudent)
        {
            throw new InvalidOperationException("Вы уже являетесь учеником этого тренера.");
        }

        var hasActiveRequest = await dbContext.StudentsRequests.AnyAsync(
            request => request.StudentId == student.Id &&
                       request.CoachId == coachId &&
                       !request.IsDeleted &&
                       request.Status == StudentRequestStatusEnum.Pending,
            cancellationToken);
        if (hasActiveRequest)
        {
            throw new InvalidOperationException("Заявка этому тренеру уже отправлена или уже принята.");
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
        return StudentRequestsQuery()
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
                              request.Status == StudentRequestStatusEnum.Pending)
            .OrderBy(request => request.CreateDate)
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
                    : item.Student.ClientInfo.Belt.Name
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<StudentRequestOutputModel> ResolveStudentRequestAsync(AuthenticatedUser coach, Guid requestId, StudentRequestStatusEnum status, CancellationToken cancellationToken)
    {
        EnsureRole(coach, UserRolesEnum.Coach);
        if (status is not (StudentRequestStatusEnum.Accepted or StudentRequestStatusEnum.Rejected))
        {
            throw new ArgumentException("Заявку можно только принять или отклонить.", nameof(status));
        }

        var request = await dbContext.StudentsRequests.SingleOrDefaultAsync(
            item => item.Id == requestId &&
                    item.CoachId == coach.Id &&
                    !item.IsDeleted &&
                    item.Status == StudentRequestStatusEnum.Pending,
            cancellationToken);
        if (request is null)
        {
            throw new KeyNotFoundException("Активная заявка не найдена.");
        }

        request.Status = status;
        if (status == StudentRequestStatusEnum.Accepted)
        {
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
        }
        else
        {
            request.IsDeleted = true;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return await StudentRequestsQuery()
            .SingleAsync(item => item.Id == request.Id, cancellationToken);
    }

    public async Task<bool> RemoveCoachStudentAsync(AuthenticatedUser coach, Guid studentId, CancellationToken cancellationToken)
    {
        EnsureRole(coach, UserRolesEnum.Coach);

        var links = await dbContext.CoachStudents
            .Where(item => item.CoachId == coach.Id && item.StudentId == studentId)
            .ToListAsync(cancellationToken);
        if (links.Count == 0)
        {
            return false;
        }

        dbContext.CoachStudents.RemoveRange(links);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
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
            throw new UnauthorizedAccessException("Недостаточно прав для выполнения операции.");
        }
    }
}
