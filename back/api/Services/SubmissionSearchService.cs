using System.Text.Json;
using System.Text.Json.Serialization;
using JiuDiary.Models.Submission;

namespace JiuDiary.Api.Services;

/// <summary>
/// Выполняет поиск по предварительно загруженному словарю приёмов.
/// </summary>
public sealed class SubmissionSearchService
{
    private readonly SubmissionSearchEntry[] _entries;

    public SubmissionSearchService(IHostEnvironment environment)
    {
        var filePath = Path.Combine(environment.ContentRootPath, "Statics", "submissions.json");
        using var stream = File.OpenRead(filePath);
        var file = JsonSerializer.Deserialize<SubmissionSearchFile>(stream)
            ?? throw new InvalidOperationException($"Не удалось прочитать словарь приёмов из файла '{filePath}'.");

        if (file.Submissions.Count == 0)
        {
            throw new InvalidOperationException("Словарь приёмов не содержит записей.");
        }

        if (file.Submissions.Select(submission => submission.Id).Distinct().Count() != file.Submissions.Count)
        {
            throw new InvalidOperationException("Словарь приёмов содержит повторяющиеся идентификаторы.");
        }

        _entries = file.Submissions
            .Select(submission => new SubmissionSearchEntry(
                new SubmissionSearchOutputModel { Id = submission.Id, Name = submission.Name },
                submission.Aliases
                    .Prepend(submission.Name)
                    .Select(Normalize)
                    .Where(term => term.Length > 0)
                    .Distinct(StringComparer.Ordinal)
                    .ToArray()))
            .OrderBy(entry => entry.Submission.Id)
            .ToArray();
    }

    /// <summary>
    /// Ищет приёмы по нормализованной подстроке в каноническом названии и алиасах.
    /// </summary>
    /// <param name="query">Часть названия или алиаса приёма.</param>
    /// <returns>Подходящие приёмы в порядке релевантности.</returns>
    public IReadOnlyList<SubmissionSearchOutputModel> Search(string? query)
    {
        var normalizedQuery = Normalize(query ?? string.Empty);
        if (normalizedQuery.Length == 0)
        {
            return [];
        }

        var matches = new List<SubmissionSearchMatch>(_entries.Length);
        foreach (var entry in _entries)
        {
            var score = GetMatchScore(entry.SearchTerms, normalizedQuery);
            if (score < int.MaxValue)
            {
                matches.Add(new SubmissionSearchMatch(entry.Submission, score));
            }
        }

        matches.Sort(static (left, right) =>
        {
            var scoreComparison = left.Score.CompareTo(right.Score);
            return scoreComparison != 0 ? scoreComparison : left.Submission.Id.CompareTo(right.Submission.Id);
        });

        return matches.Select(match => match.Submission).ToArray();
    }

    private static int GetMatchScore(string[] searchTerms, string query)
    {
        var bestScore = int.MaxValue;
        foreach (var term in searchTerms)
        {
            if (term.Equals(query, StringComparison.Ordinal))
            {
                return 0;
            }

            if (term.StartsWith(query, StringComparison.Ordinal))
            {
                bestScore = 1;
            }
            else if (bestScore > 2 && term.Contains(query, StringComparison.Ordinal))
            {
                bestScore = 2;
            }
        }

        return bestScore;
    }

    private static string Normalize(string value)
    {
        var result = new char[value.Length];
        var length = 0;
        var previousWasSeparator = true;

        foreach (var sourceCharacter in value)
        {
            var character = char.ToLowerInvariant(sourceCharacter);
            character = character == 'ё' ? 'е' : character;
            if (char.IsLetterOrDigit(character))
            {
                result[length++] = character;
                previousWasSeparator = false;
            }
            else if (!previousWasSeparator)
            {
                result[length++] = ' ';
                previousWasSeparator = true;
            }
        }

        if (length > 0 && result[length - 1] == ' ')
        {
            length--;
        }

        return new string(result, 0, length);
    }

    private sealed record SubmissionSearchEntry(SubmissionSearchOutputModel Submission, string[] SearchTerms);

    private sealed record SubmissionSearchMatch(SubmissionSearchOutputModel Submission, int Score);

    private sealed class SubmissionSearchFile
    {
        [JsonPropertyName("submissions")]
        public List<SubmissionSearchFileEntry> Submissions { get; set; } = [];
    }

    private sealed class SubmissionSearchFileEntry
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("aliases")]
        public List<string> Aliases { get; set; } = [];
    }
}
