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
    public Task<PagedResult<TrainerOutputModel>> GetTrainersAsync(
        Filter filter,
        CancellationToken cancellationToken)
    {
        var trainers = dbContext.Users
            .AsNoTracking()
            .Where(user => user.IsActive && user.RoleId == (int)UserRolesEnum.Coach)
            .ApplySearch(
                filter.Search,
                search => user => user.Name.Contains(search) || user.Login.Contains(search))
            .OrderBy(user => user.Name)
            .ThenBy(user => user.Login)
            .Select(user => new TrainerOutputModel
            {
                Id = user.Id,
                Name = user.Name,
                Login = user.Login,
                BeltId = user.ClientInfo == null ? null : user.ClientInfo.BeltId,
                BeltName = user.ClientInfo == null || user.ClientInfo.Belt == null
                    ? null
                    : user.ClientInfo.Belt.Name
            });

        return trainers.ToPagedResultAsync(filter, cancellationToken);
    }

    public async Task<StudentRequestOutputModel> CreateStudentRequestAsync(
        AuthenticatedUser student,
        Guid coachId,
        CancellationToken cancellationToken)
    {
        EnsureRole(student, UserRolesEnum.Student);

        var coachExists = await dbContext.Users.AnyAsync(
            user => user.Id == coachId && user.IsActive && user.RoleId == (int)UserRolesEnum.Coach,
            cancellationToken);
        if (!coachExists)
        {
            throw new KeyNotFoundException("Тренер не найден.");
        }

        var hasActiveRequest = await dbContext.StudentsRequests.AnyAsync(
            request => request.StudentId == student.Id &&
                       request.CoachId == coachId &&
                       !request.IsDeleted &&
                       (request.Status == StudentRequestStatusEnum.Pending ||
                        request.Status == StudentRequestStatusEnum.Accepted),
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

    public Task<List<StudentRequestOutputModel>> GetStudentRequestsAsync(
        AuthenticatedUser student,
        CancellationToken cancellationToken)
    {
        EnsureRole(student, UserRolesEnum.Student);
        return StudentRequestsQuery()
            .Where(request => request.StudentId == student.Id)
            .OrderByDescending(request => request.CreateDate)
            .ToListAsync(cancellationToken);
    }

    public Task<List<TrainerOutputModel>> GetStudentTrainersAsync(
        AuthenticatedUser student,
        CancellationToken cancellationToken)
    {
        EnsureRole(student, UserRolesEnum.Student);
        return dbContext.StudentsRequests
            .AsNoTracking()
            .Where(request => request.StudentId == student.Id &&
                              !request.IsDeleted &&
                              request.Status == StudentRequestStatusEnum.Accepted)
            .OrderBy(request => request.Coach.Name)
            .Select(request => new TrainerOutputModel
            {
                Id = request.Coach.Id,
                Name = request.Coach.Name,
                Login = request.Coach.Login,
                BeltId = request.Coach.ClientInfo == null ? null : request.Coach.ClientInfo.BeltId,
                BeltName = request.Coach.ClientInfo == null || request.Coach.ClientInfo.Belt == null
                    ? null
                    : request.Coach.ClientInfo.Belt.Name
            })
            .ToListAsync(cancellationToken);
    }

    public Task<List<StudentRequestOutputModel>> GetCoachRequestsAsync(
        AuthenticatedUser coach,
        CancellationToken cancellationToken)
    {
        EnsureRole(coach, UserRolesEnum.Coach);
        return StudentRequestsQuery()
            .Where(request => request.CoachId == coach.Id &&
                              request.Status == StudentRequestStatusEnum.Pending)
            .OrderBy(request => request.CreateDate)
            .ToListAsync(cancellationToken);
    }

    public Task<List<StudentOutputModel>> GetCoachStudentsAsync(
        AuthenticatedUser coach,
        CancellationToken cancellationToken)
    {
        EnsureRole(coach, UserRolesEnum.Coach);
        return dbContext.StudentsRequests
            .AsNoTracking()
            .Where(request => request.CoachId == coach.Id &&
                              !request.IsDeleted &&
                              request.Status == StudentRequestStatusEnum.Accepted)
            .OrderBy(request => request.Student.Name)
            .Select(request => new StudentOutputModel
            {
                Id = request.Student.Id,
                Name = request.Student.Name,
                Login = request.Student.Login,
                BeltId = request.Student.ClientInfo == null ? null : request.Student.ClientInfo.BeltId,
                BeltName = request.Student.ClientInfo == null || request.Student.ClientInfo.Belt == null
                    ? null
                    : request.Student.ClientInfo.Belt.Name
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<StudentRequestOutputModel> ResolveStudentRequestAsync(
        AuthenticatedUser coach,
        Guid requestId,
        StudentRequestStatusEnum status,
        CancellationToken cancellationToken)
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
        await dbContext.SaveChangesAsync(cancellationToken);

        return await StudentRequestsQuery()
            .SingleAsync(item => item.Id == request.Id, cancellationToken);
    }

    private IQueryable<StudentRequestOutputModel> StudentRequestsQuery() =>
        dbContext.StudentsRequests
            .AsNoTracking()
            .Where(request => !request.IsDeleted)
            .Select(request => new StudentRequestOutputModel
            {
                Id = request.Id,
                StudentId = request.StudentId,
                StudentName = request.Student.Name,
                StudentLogin = request.Student.Login,
                CoachId = request.CoachId,
                CoachName = request.Coach.Name,
                CoachLogin = request.Coach.Login,
                Status = request.Status,
                CreateDate = request.CreateDate
            });

    private static void EnsureRole(AuthenticatedUser user, UserRolesEnum role)
    {
        if (user.Role != role)
        {
            throw new UnauthorizedAccessException("Недостаточно прав для выполнения операции.");
        }
    }
}
