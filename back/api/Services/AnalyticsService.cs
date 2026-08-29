using JiuDiary.Api.Auth;
using JiuDiary.Database;
using JiuDiary.Database.Enums;
using JiuDiary.Models.Analytics;
using JiraDiary.AspCore.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.Services;

public sealed class AnalyticsService(JiuDiaryDbContext dbContext, ILogger<AnalyticsService> logger)
{
    private const int MaxPeriodDays = 3660;

    /// <summary>
    /// Получает количество схваток текущего клиента по дням за выбранный период.
    /// </summary>
    public async Task<FightAnalyticsOutputModel> GetFights(DateOnly fromDate, DateOnly toDate, AuthenticatedUser user, CancellationToken cancellationToken)
    {
        EnsureSupportedRole(user);
        ValidatePeriod(fromDate, toDate);

        var fromDateTime = fromDate.ToDateTime(TimeOnly.MinValue);
        var toDateTimeExclusive = toDate.ToDateTime(TimeOnly.MinValue).AddDays(1);
        var dailyFights = await dbContext.ClientTrainings
            .AsNoTracking()
            .Where(clientTraining => clientTraining.ClientInfo.UserId == user.Id && clientTraining.Training.StartTime >= fromDateTime && clientTraining.Training.StartTime < toDateTimeExclusive)
            .GroupBy(clientTraining => clientTraining.Training.StartTime.Date)
            .Select(group => new
            {
                Date = group.Key,
                FightsCount = group.Sum(clientTraining => clientTraining.Rounds ?? 0)
            })
            .OrderBy(item => item.Date)
            .ToListAsync(cancellationToken);

        var points = dailyFights.Select(item => new FightAnalyticsPointOutputModel
        {
            Date = DateOnly.FromDateTime(item.Date),
            FightsCount = item.FightsCount
        }).ToList();

        var result = new FightAnalyticsOutputModel
        {
            FromDate = fromDate,
            ToDate = toDate,
            FightsCount = points.Sum(point => point.FightsCount),
            Points = points
        };

        logger.LogInformation("Аналитика схваток получена. UserId: {UserId} | FromDate: {FromDate} | ToDate: {ToDate} | FightsCount: {FightsCount}", user.Id, fromDate, toDate, result.FightsCount);
        return result;
    }

    private static void ValidatePeriod(DateOnly fromDate, DateOnly toDate)
    {
        if (fromDate == default || toDate == default || toDate < fromDate)
        {
            throw new AspNetException("Необходимо указать корректный период аналитики.", StatusCodes.Status400BadRequest);
        }

        if (toDate == DateOnly.MaxValue || toDate.DayNumber - fromDate.DayNumber + 1 > MaxPeriodDays)
        {
            throw new AspNetException($"Период аналитики не должен превышать {MaxPeriodDays} дней.", StatusCodes.Status400BadRequest);
        }
    }

    private static void EnsureSupportedRole(AuthenticatedUser user)
    {
        if (user.Role is not UserRolesEnum.Coach and not UserRolesEnum.Student)
        {
            throw new AspNetException("Аналитика доступна только тренеру или ученику.", StatusCodes.Status403Forbidden);
        }
    }
}
