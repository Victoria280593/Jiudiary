using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Database.Entities;

[Table("CoachBranches")]
[Index(nameof(CoachId), nameof(BranchId), IsUnique = true)]
public sealed class CoachBranch
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    [ForeignKey(nameof(Coach))]
    public Guid CoachId { get; set; }

    [ForeignKey(nameof(Branch))]
    public Guid BranchId { get; set; }

    public ClientInfo Coach { get; set; } = null!;

    public Branch Branch { get; set; } = null!;
}
