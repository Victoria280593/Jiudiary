using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Database.Entities;

[Table("StudentGroups")]
[Index(nameof(StudentId), nameof(GroupId), IsUnique = true)]
public sealed class StudentGroup
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    [ForeignKey(nameof(Group))]
    public Guid GroupId { get; set; }

    [ForeignKey(nameof(Student))]
    public Guid StudentId { get; set; }

    public Group Group { get; set; } = null!;

    public ClientInfo Student { get; set; } = null!;
}
