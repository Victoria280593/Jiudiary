using System.Text.Json;
using System.Text.Json.Serialization;
using JiuDiary.Models.Submission;

namespace JiuDiary.Api.Services;

/// <summary>
/// Выполняет поиск приёмов по каноническим названиям и алиасам из статического JSON-словаря.
/// </summary>
/// <remarks>
/// Сервис зарегистрирован как singleton и принудительно создаётся при запуске приложения.
/// Файл <c>Statics/submissions.json</c> читается только в конструкторе, после чего для каждого
/// приёма один раз формируется массив нормализованных поисковых строк. Во время HTTP-запросов
/// сервис не обращается ни к файлу, ни к базе данных и работает только с данными в памяти.
/// </remarks>
public sealed class SubmissionSearchService
{
    /// <summary>
    /// Подготовленные при запуске приёмы вместе с нормализованными каноническими названиями и алиасами.
    /// </summary>
    private readonly SubmissionSearchEntry[] _entries;

    /// <summary>
    /// Загружает статический словарь и подготавливает его к поиску.
    /// </summary>
    /// <param name="environment">Окружение приложения, предоставляющее путь к корневой папке API.</param>
    /// <exception cref="InvalidOperationException">Словарь пуст или содержит повторяющиеся идентификаторы.</exception>
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
                new SubmissionSearchOutputModel { Id = submission.Id, NameRu = submission.NameRu, NameEn = submission.NameEn },
                submission.Aliases
                    .Prepend(submission.NameEn)
                    .Prepend(submission.NameRu)
                    .Select(Normalize)
                    .Where(term => term.Length > 0)
                    .Distinct(StringComparer.Ordinal)
                    .ToArray()))
            .OrderBy(entry => entry.Submission.Id)
            .ToArray();
    }

    /// <summary>
    /// Ищет приёмы по подстроке одновременно в канонических русском и английском названиях и во всех алиасах.
    /// </summary>
    /// <remarks>
    /// Запрос нормализуется по тем же правилам, что и строки словаря. Для каждого приёма выбирается
    /// наиболее релевантное совпадение: точное совпадение имеет приоритет над совпадением с началом
    /// строки, а совпадение с началом строки — над вхождением в произвольной части строки.
    /// При одинаковой релевантности результаты сортируются по идентификатору для стабильного порядка.
    /// Пустой запрос возвращает пустой список.
    /// </remarks>
    /// <param name="query">Часть канонического названия или любого алиаса приёма.</param>
    /// <returns>Найденные приёмы без алиасов, отсортированные по релевантности и идентификатору.</returns>
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

    /// <summary>
    /// Определяет лучшее совпадение запроса с одной из поисковых строк приёма.
    /// </summary>
    /// <param name="searchTerms">Нормализованное каноническое название и нормализованные алиасы одного приёма.</param>
    /// <param name="query">Нормализованный поисковый запрос.</param>
    /// <returns>
    /// <c>0</c> для точного совпадения, <c>1</c> для совпадения с началом строки,
    /// <c>2</c> для вхождения подстроки или <see cref="int.MaxValue"/>, если совпадений нет.
    /// </returns>
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

    /// <summary>
    /// Приводит пользовательский ввод и значения словаря к единой форме для регистронезависимого поиска.
    /// </summary>
    /// <remarks>
    /// Буквы переводятся в нижний регистр, <c>ё</c> заменяется на <c>е</c>, а любые последовательности
    /// символов кроме букв и цифр заменяются одним пробелом. Благодаря одинаковой нормализации ввод
    /// можно сопоставлять с названиями независимо от регистра, лишних пробелов, дефисов и пунктуации.
    /// </remarks>
    /// <param name="value">Исходное название, алиас или пользовательский запрос.</param>
    /// <returns>Нормализованная строка без ведущих и завершающих разделителей.</returns>
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

    /// <summary>
    /// Связывает данные, возвращаемые клиенту, со всеми строками, по которым должен находиться приём.
    /// </summary>
    /// <param name="Submission">Канонические данные приёма для ответа API.</param>
    /// <param name="SearchTerms">Нормализованное название и уникальные алиасы приёма.</param>
    private sealed record SubmissionSearchEntry(SubmissionSearchOutputModel Submission, string[] SearchTerms);

    /// <summary>
    /// Хранит найденный приём и оценку совпадения, используемую только для сортировки результата.
    /// </summary>
    /// <param name="Submission">Найденный приём.</param>
    /// <param name="Score">Оценка релевантности: меньшее значение означает более точное совпадение.</param>
    private sealed record SubmissionSearchMatch(SubmissionSearchOutputModel Submission, int Score);

    /// <summary>
    /// Описывает корневой объект файла <c>submissions.json</c> для десериализации.
    /// </summary>
    private sealed class SubmissionSearchFile
    {
        /// <summary>
        /// Все приёмы, загруженные из статического словаря.
        /// </summary>
        [JsonPropertyName("submissions")]
        public List<SubmissionSearchFileEntry> Submissions { get; set; } = [];
    }

    /// <summary>
    /// Описывает одну запись статического словаря до подготовки поискового индекса.
    /// </summary>
    private sealed class SubmissionSearchFileEntry
    {
        /// <summary>
        /// Идентификатор соответствующей записи в таблице Submissions.
        /// </summary>
        [JsonPropertyName("id")]
        public int Id { get; set; }

        /// <summary>
        /// Каноническое русскоязычное название приёма, участвующее в поиске и возвращаемое клиенту.
        /// </summary>
        [JsonPropertyName("nameRu")]
        public string NameRu { get; set; } = string.Empty;

        /// <summary>
        /// Каноническое англоязычное название приёма, участвующее в поиске и возвращаемое клиенту.
        /// </summary>
        [JsonPropertyName("nameEn")]
        public string NameEn { get; set; } = string.Empty;

        /// <summary>
        /// Дополнительные варианты написания и транслитерации для поиска.
        /// </summary>
        [JsonPropertyName("aliases")]
        public List<string> Aliases { get; set; } = [];
    }
}
