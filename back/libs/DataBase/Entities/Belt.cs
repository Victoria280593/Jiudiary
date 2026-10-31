using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Database.Entities;

[Table("Belts")]
[Index(nameof(Name), IsUnique = true)]
public sealed class Belt
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public ICollection<ClientInfo> ClientInfos { get; set; } = [];

    public ICollection<ClientBelt> ClientBelts { get; set; } = [];
}
