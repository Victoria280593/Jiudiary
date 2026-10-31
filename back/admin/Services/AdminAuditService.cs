using JiuDiary.Admin.Models;
using JiuDiary.Database;
using JiuDiary.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Admin.Services;

public sealed class AdminAuditService(JiuDiaryDbContext dbContext)
{
    public async Task WriteAsync(
        string actorLogin,
        string eventType,
        string action,
        string path,
        int statusCode,
        string? details,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        dbContext.AdminAuditLogs.Add(new AdminAuditLog
        {
            Id = Guid.NewGuid(),
            ActorLogin = actorLogin,
            EventType = eventType,
            Action = action,
            Path = path,
            StatusCode = statusCode,
            Details = details,
            IpAddress = ipAddress,
            CreatedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AuditLogItemViewModel>> GetRecentAsync(
        CancellationToken cancellationToken)
    {
        return await dbContext.AdminAuditLogs
            .AsNoTracking()
            .OrderByDescending(item => item.CreatedAt)
            .Take(200)
            .Select(item => new AuditLogItemViewModel
            {
                CreatedAt = item.CreatedAt,
                ActorLogin = item.ActorLogin,
                EventType = item.EventType,
                Action = item.Action,
                Path = item.Path,
                StatusCode = item.StatusCode,
                Details = item.Details,
                IpAddress = item.IpAddress
            })
            .ToListAsync(cancellationToken);
    }
}
