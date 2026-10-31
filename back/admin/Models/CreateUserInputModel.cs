using System.ComponentModel.DataAnnotations;
using JiuDiary.Database.Enums;

namespace JiuDiary.Admin.Models;

public sealed class CreateUserInputModel
{
    [Required, StringLength(256, MinimumLength = 3)]
    public string Login { get; set; } = string.Empty;

    [Required, StringLength(200)]
    public string FirstName { get; set; } = string.Empty;

    [Required, StringLength(200)]
    public string LastName { get; set; } = string.Empty;

    [StringLength(200)]
    public string? MiddleName { get; set; }

    [Required, StringLength(128, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public UserRolesEnum Role { get; set; } = UserRolesEnum.Student;
}
