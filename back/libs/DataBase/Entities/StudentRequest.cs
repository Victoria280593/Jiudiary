using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using JiuDiary.Database.Enums;

namespace JiuDiary.Database.Entities;

[Table("StudentsRequests")]
public sealed class StudentRequest
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }

    public Guid CoachId { get; set; }

    public StudentRequestStatusEnum Status { get; set; }

    public DateTime CreateDate { get; set; }

    public bool IsDeleted { get; set; }

    public User Student { get; set; } = null!;

    public User Coach { get; set; } = null!;
}
