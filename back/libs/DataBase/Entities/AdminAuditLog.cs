using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JiuDiary.Database.Entities;

[Table("AdminAuditLogs")]
public sealed class AdminAuditLog
{
    [Key]
    public Guid Id { get; set; }

    [Required, MaxLength(256)]
    public string ActorLogin { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string EventType { get; set; } = string.Empty;

    [Required, MaxLength(10)]
    public string Action { get; set; } = string.Empty;

    [Required, MaxLength(512)]
    public string Path { get; set; } = string.Empty;

    public int StatusCode { get; set; }

    [MaxLength(2000)]
    public string? Details { get; set; }

    [MaxLength(64)]
    public string? IpAddress { get; set; }

    public DateTime CreatedAt { get; set; }
}
