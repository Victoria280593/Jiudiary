using JiuDiary.Admin.Models;
using JiuDiary.Database;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Admin.Services;

public sealed class AdminUserService(JiuDiaryDbContext dbContext)
{
    public async Task<IReadOnlyList<UserListItemViewModel>> GetUsersAsync(
        string? search,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Users
            .AsNoTracking()
            .Include(user => user.Role)
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
                Role = user.Role.Name,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                LastPasswordChangedAt = user.LastPasswordChangedAt,
                IsActive = user.IsActive
            })
            .ToListAsync(cancellationToken);
    }
}
