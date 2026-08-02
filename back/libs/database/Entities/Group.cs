using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel;

namespace JiuDiary.Database.Entities;

[Table("Groups")]
public sealed class Group
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [DefaultValue(6)]
    [ForeignKey(nameof(Color))]
    public int ColorId { get; set; } = 6;

    [Required]
    public TimeSpan? DefaultStartTime { get; set; }

    [Required]
    public TimeSpan? DefaultEndTime { get; set; }

    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public DateTime CreatedAt { get; set; }

    public GroupColor Color { get; set; } = null!;

    public ICollection<CoachGroup> CoachGroups { get; set; } = [];

    public ICollection<Training> Trainings { get; set; } = [];
}
