using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Database.Entities;

/// <summary>
/// Альтернативное написание приёма из библиотеки Submissions (транслитерация, сленг, устаревшее название).
/// Используется только для поиска — не отображается как основное название.
/// </summary>
[Table("SubmissionAliases")]
[Index(nameof(Alias), IsUnique = true)]
public sealed class SubmissionAlias
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    [ForeignKey(nameof(Submission))]
    public int SubmissionId { get; set; }

    [Required]
    [MaxLength(150)]
    public string Alias { get; set; } = string.Empty;

    public Submission Submission { get; set; } = null!;
}
