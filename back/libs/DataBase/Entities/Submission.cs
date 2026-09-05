using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Database.Entities;

/// <summary>
/// Приём (болевой или удушающий) из библиотеки известных названий БЖЖ.
/// </summary>
[Table("Submissions")]
[Index(nameof(NameRu), IsUnique = true)]
[Index(nameof(NameEn), IsUnique = true)]
public sealed class Submission
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string NameRu { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string NameEn { get; set; } = string.Empty;

    public ICollection<ClientTrainingSubmission> ClientTrainingSubmissions { get; set; } = [];
}
