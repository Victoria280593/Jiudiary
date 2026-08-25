using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JiuDiary.Database.Entities;

[Table("Trainings")]
public sealed class Training
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public Guid Id { get; set; }

    [ForeignKey(nameof(Coach))]
    public Guid CoachId { get; set; }

    [ForeignKey(nameof(Group))]
    public Guid GroupId { get; set; }

    [MaxLength(300)]
    public string? Description { get; set; }

    [Required]
    public DateTime StartTime { get; set; }

    [Required]
    public DateTime EndTime { get; set; }

    public ClientInfo Coach { get; set; } = null!;

    public Group Group { get; set; } = null!;

    public ICollection<ClientTraining> ClientTrainings { get; set; } = [];
}
