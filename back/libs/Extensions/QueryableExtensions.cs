using System.Linq.Expressions;
using JiuDiary.Extensions.Models;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Extensions;

public static class QueryableExtensions
{
    private const int DefaultItemsPerPage = 10;
    private const int MaxItemsPerPage = 100;

    public static IQueryable<T> ApplySearch<T>(
        this IQueryable<T> query,
        string? search,
        Func<string, Expression<Func<T, bool>>> predicateFactory)
    {
        var normalizedSearch = search?.Trim();
        return string.IsNullOrEmpty(normalizedSearch)
            ? query
            : query.Where(predicateFactory(normalizedSearch));
    }

    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> query,
        Filter filter,
        CancellationToken cancellationToken = default)
    {
        var page = Math.Max(filter.Page, 1);
        var itemsPerPage = filter.ItemsPerPage <= 0
            ? DefaultItemsPerPage
            : Math.Min(filter.ItemsPerPage, MaxItemsPerPage);
        var totalItems = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * itemsPerPage)
            .Take(itemsPerPage)
            .ToListAsync(cancellationToken);

        return new PagedResult<T>
        {
            Items = items,
            Page = page,
            ItemsPerPage = itemsPerPage,
            TotalItems = totalItems,
            TotalPages = totalItems == 0
                ? 0
                : (int)Math.Ceiling(totalItems / (double)itemsPerPage)
        };
    }
}
