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
    /// Получает сводные показатели, динамику схваток и распределение сабмишенов текущего клиента.
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
                FightsCount = group.Sum(clientTraining => clientTraining.Rounds ?? 0),
                TrainingsCount = group.Count()
            })
            .OrderBy(item => item.Date)
            .ToListAsync(cancellationToken);

        var allTimeTotals = await dbContext.ClientTrainings
            .AsNoTracking()
            .Where(clientTraining => clientTraining.ClientInfo.UserId == user.Id)
            .GroupBy(_ => 1)
            .Select(group => new
            {
                FightsCount = group.Sum(clientTraining => clientTraining.Rounds ?? 0),
                TrainingsCount = group.Count()
            })
            .SingleOrDefaultAsync(cancellationToken);

        var allTimeSubmissionsCount = await dbContext.ClientTrainingSubmissions
            .AsNoTracking()
            .Where(item => item.ClientTraining.ClientInfo.UserId == user.Id)
            .SumAsync(item => (int?)item.Count, cancellationToken) ?? 0;
        var submissionDistribution = await dbContext.ClientTrainingSubmissions
            .AsNoTracking()
            .Where(item =>
                item.ClientTraining.ClientInfo.UserId == user.Id &&
                item.ClientTraining.Training.StartTime >= fromDateTime &&
                item.ClientTraining.Training.StartTime < toDateTimeExclusive)
            .GroupBy(item => new { item.SubmissionId, item.Submission.NameRu, item.Submission.NameEn })
            .Select(group => new SubmissionAnalyticsPointOutputModel
            {
                SubmissionId = group.Key.SubmissionId,
                NameRu = group.Key.NameRu,
                NameEn = group.Key.NameEn,
                Count = group.Sum(item => item.Count)
            })
            .OrderByDescending(item => item.Count)
            .ThenBy(item => item.SubmissionId)
            .ToListAsync(cancellationToken);

        var points = dailyFights.Select(item => new FightAnalyticsPointOutputModel
        {
            Date = DateOnly.FromDateTime(item.Date),
            FightsCount = item.FightsCount,
            TrainingsCount = item.TrainingsCount
        }).ToList();

        var periodFightsCount = dailyFights.Sum(item => item.FightsCount);
        var periodTrainingsCount = dailyFights.Sum(item => item.TrainingsCount);
        var periodSubmissionsCount = submissionDistribution.Sum(item => item.Count);
        var result = new FightAnalyticsOutputModel
        {
            FromDate = fromDate,
            ToDate = toDate,
            AllTimeFightsCount = allTimeTotals?.FightsCount ?? 0,
            PeriodFightsCount = periodFightsCount,
            AllTimeTrainingsCount = allTimeTotals?.TrainingsCount ?? 0,
            PeriodTrainingsCount = periodTrainingsCount,
            AllTimeSubmissionsCount = allTimeSubmissionsCount,
            PeriodSubmissionsCount = periodSubmissionsCount,
            AllTimeAverageFightsPerTraining = CalculateAverage(allTimeTotals?.FightsCount ?? 0, allTimeTotals?.TrainingsCount ?? 0),
            PeriodAverageFightsPerTraining = CalculateAverage(periodFightsCount, periodTrainingsCount),
            Points = points,
            SubmissionDistribution = submissionDistribution
        };

        logger.LogInformation("Аналитика схваток получена. UserId: {UserId} | FromDate: {FromDate} | ToDate: {ToDate} | AllTimeFightsCount: {AllTimeFightsCount} | PeriodFightsCount: {PeriodFightsCount}", user.Id, fromDate, toDate, result.AllTimeFightsCount, result.PeriodFightsCount);
        return result;
    }

    private static decimal CalculateAverage(int fightsCount, int trainingsCount) => trainingsCount == 0 ? 0 : Math.Round((decimal)fightsCount / trainingsCount, 1, MidpointRounding.AwayFromZero);

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
