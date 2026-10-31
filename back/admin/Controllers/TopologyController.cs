using JiuDiary.Admin.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JiuDiary.Admin.Controllers;

[Authorize(Policy = "AdminOnly")]
public sealed class TopologyController : Controller
{
    [HttpGet]
    public IActionResult Index() => View(TopologyViewModel.Create());
}
