using JiuDiary.Admin.Models;
using JiuDiary.Database;
using JiuDiary.Database.Entities;
using JiuDiary.Database.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Admin.Services;

public sealed class AdminUserService(
    JiuDiaryDbContext dbContext,
    IPasswordHasher<User> passwordHasher)
{
    public async Task<bool> CreateUserAsync(
        CreateUserInputModel input,
        CancellationToken cancellationToken)
    {
        var login = input.Login.Trim();
        if (await dbContext.Users.AnyAsync(
                user => user.Login == login && user.RoleId == (int)input.Role,
                cancellationToken))
        {
            return false;
        }

        var role = await dbContext.Roles.SingleOrDefaultAsync(
            item => item.Id == (int)input.Role && item.Name == input.Role.ToString(),
            cancellationToken);
        if (role is null)
        {
            throw new InvalidOperationException("Выбранная роль не найдена в базе данных.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Login = login,
            IsActive = true,
            RoleId = role.Id,
            Role = role,
            PasswordHash = string.Empty,
            LastPasswordChangedAt = DateTime.UtcNow
        };
        user.PasswordHash = passwordHasher.HashPassword(user, input.Password);
        user.ClientInfo = new ClientInfo
        {
            UserId = user.Id,
            FirstName = input.FirstName.Trim(),
            LastName = input.LastName.Trim(),
            MiddleName = string.IsNullOrWhiteSpace(input.MiddleName) ? null : input.MiddleName.Trim()
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<UserListItemViewModel>> GetUsersAsync(
        string? search,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Users
            .AsNoTracking()
            .Include(user => user.Role)
            .Include(user => user.ClientInfo)
            .ThenInclude(clientInfo => clientInfo!.Belt)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim();
            query = query.Where(user => user.Login.Contains(normalizedSearch));
        }

        return await query
            .OrderByDescending(user => user.CreatedAt)
            .Select(user => new UserListItemViewModel
            {
                Id = user.Id,
                Login = user.Login,
                FullName = user.ClientInfo == null
                    ? string.Empty
                    : string.Join(" ", new[]
                    {
                        user.ClientInfo.LastName,
                        user.ClientInfo.FirstName,
                        user.ClientInfo.MiddleName
                    }.Where(value => !string.IsNullOrWhiteSpace(value))),
                Belt = user.ClientInfo != null && user.ClientInfo.Belt != null
                    ? user.ClientInfo.Belt.Name
                    : string.Empty,
                Role = user.Role.Name,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                LastPasswordChangedAt = user.LastPasswordChangedAt,
                IsActive = user.IsActive
            })
            .ToListAsync(cancellationToken);
    }
}
