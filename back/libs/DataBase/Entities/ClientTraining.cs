using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JiuDiary.Database.Entities;

[Table("ClientTrainings")]
public sealed class ClientTraining : IAuditable
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    [ForeignKey(nameof(ClientInfo))]
    public Guid ClientInfoId { get; set; }

    [ForeignKey(nameof(Training))]
    public Guid TrainingId { get; set; }

    public int? Rounds { get; set; }

    public bool Attended { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public ClientInfo ClientInfo { get; set; } = null!;

    public Training Training { get; set; } = null!;
}
