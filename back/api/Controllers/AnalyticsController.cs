using JiuDiary.Api.Services;
using JiuDiary.Models.Analytics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JiuDiary.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/analytics")]
[Produces("application/json")]
public sealed class AnalyticsController(AnalyticsService analyticsService) : BaseController
{
    /// <summary>
    /// Получает общую аналитику тренировок текущего клиента за выбранный период и за всё время.
    /// </summary>
    [HttpGet("fights")]
    [ProducesResponseType<FightAnalyticsOutputModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<FightAnalyticsOutputModel>> GetFights([FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate, CancellationToken cancellationToken)
        => Ok(await analyticsService.GetFights(fromDate, toDate, CurrentUser, cancellationToken));
}
