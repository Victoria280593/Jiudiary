using JiuDiary.Database.Enums;

namespace JiuDiary.Models.Trainer;

public sealed class UpdateStudentRequestInputModel
{
    public StudentRequestStatusEnum Status { get; set; }
}
