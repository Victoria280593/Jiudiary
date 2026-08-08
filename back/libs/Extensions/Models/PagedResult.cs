namespace JiuDiary.Extensions.Models;

public sealed class PagedResult<T>
{
    public required IReadOnlyList<T> Items { get; init; }

    public required int Page { get; init; }

    public required int ItemsPerPage { get; init; }

    public required int TotalItems { get; init; }

    public required int TotalPages { get; init; }
}
