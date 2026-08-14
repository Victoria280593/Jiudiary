using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Database.Entities;

/// <summary>
/// Приём (болевой или удушающий) из библиотеки известных названий БЖЖ.
/// </summary>
[Table("Submissions")]
[Index(nameof(Name), IsUnique = true)]
public sealed class Submission
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;
}
