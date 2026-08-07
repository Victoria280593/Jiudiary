using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JiuDiary.Database.Entities;

[Table("coach_students")]
public sealed class CoachStudent
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid CoachId { get; set; }

    public Guid StudentId { get; set; }

    public DateTime CreateDate { get; set; }

    public User Coach { get; set; } = null!;

    public User Student { get; set; } = null!;
}
