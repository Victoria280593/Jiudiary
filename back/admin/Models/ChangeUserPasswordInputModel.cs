using System.ComponentModel.DataAnnotations;

namespace JiuDiary.Admin.Models;

public sealed class ChangeUserPasswordInputModel
{
    [Required(ErrorMessage = "Введите новый пароль.")]
    [MinLength(8, ErrorMessage = "Пароль должен содержать минимум 8 символов.")]
    [DataType(DataType.Password)]
    [Display(Name = "Новый пароль")]
    public string NewPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Повторите новый пароль.")]
    [Compare(nameof(NewPassword), ErrorMessage = "Пароли не совпадают.")]
    [DataType(DataType.Password)]
    [Display(Name = "Повторите пароль")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
