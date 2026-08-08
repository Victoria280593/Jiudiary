namespace JiuDiary.Extensions.Models;

public sealed class Filter
{
    public int Page { get; set; } = 1;

    public int ItemsPerPage { get; set; } = 10;

    public string? Search { get; set; }
}
