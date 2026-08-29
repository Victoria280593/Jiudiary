using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JiuDiary.Database.Entities;

[Table("ClientBelts")]
public sealed class ClientBelt : IAuditable
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    [ForeignKey(nameof(ClientInfo))]
    public Guid ClientInfoId { get; set; }

    [ForeignKey(nameof(Belt))]
    public int BeltId { get; set; }

    public DateOnly? ReceivedDate { get; set; }

    public int StripesCount { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public ClientInfo ClientInfo { get; set; } = null!;

    public Belt Belt { get; set; } = null!;
}
