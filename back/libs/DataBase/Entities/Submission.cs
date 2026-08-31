using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Database.Entities;

/// <summary>
/// Приём (болевой или удушающий) из библиотеки известных названий БЖЖ.
/// </summary>
[Table("Submissions")]
[Index(nameof(Name), IsUnique = true)]
[Index(nameof(NameEn), IsUnique = true)]
public sealed class Submission
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Каноническое англоязычное название приёма (для отображения и поиска).
    /// </summary>
    [Required]
    [MaxLength(150)]
    public string NameEn { get; set; } = string.Empty;

    /// <summary>
    /// Дополнительные варианты написания приёма (транслитерации, сленг, устаревшие названия) — только для поиска.
    /// </summary>
    public ICollection<SubmissionAlias> Aliases { get; set; } = [];
}
