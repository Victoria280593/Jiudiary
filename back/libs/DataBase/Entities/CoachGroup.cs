using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Database.Entities;

[Table("CoachGroups")]
[Index(nameof(CoachId), nameof(GroupId), IsUnique = true)]
public sealed class CoachGroup
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    [ForeignKey(nameof(Coach))]
    public Guid CoachId { get; set; }

    [ForeignKey(nameof(Group))]
    public Guid GroupId { get; set; }

    public ClientInfo Coach { get; set; } = null!;

    public Group Group { get; set; } = null!;
}
