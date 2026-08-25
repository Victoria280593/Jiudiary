using JiuDiary.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Database;

/// <summary>
/// Контекст доступа к основной базе данных JiuDiary.
/// Ограничения и связи сущностей описаны атрибутами в самих моделях базы данных.
/// </summary>
public sealed class JiuDiaryDbContext(DbContextOptions<JiuDiaryDbContext> options)
    : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<Role> Roles => Set<Role>();

    public DbSet<AuthSession> AuthSessions => Set<AuthSession>();

    public DbSet<ClientInfo> ClientInfos => Set<ClientInfo>();

    public DbSet<Belt> Belts => Set<Belt>();

    public DbSet<ClientBelt> ClientBelts => Set<ClientBelt>();

    public DbSet<Submission> Submissions => Set<Submission>();

    public DbSet<Group> Groups => Set<Group>();

    public DbSet<GroupColor> Colors => Set<GroupColor>();

    public DbSet<CoachGroup> CoachGroups => Set<CoachGroup>();

    public DbSet<Training> Trainings => Set<Training>();

    public DbSet<ClientTraining> ClientTrainings => Set<ClientTraining>();

    public DbSet<StudentRequest> StudentsRequests => Set<StudentRequest>();

    public DbSet<CoachStudent> CoachStudents => Set<CoachStudent>();

    public DbSet<StudentGroup> StudentGroups => Set<StudentGroup>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<StudentRequest>(entity =>
        {
            entity.HasOne(request => request.Student)
                .WithMany(user => user.SentStudentRequests)
                .HasForeignKey(request => request.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(request => request.Coach)
                .WithMany(user => user.ReceivedStudentRequests)
                .HasForeignKey(request => request.CoachId)
                .OnDelete(DeleteBehavior.Restrict);

        });

        modelBuilder.Entity<CoachStudent>(entity =>
        {
            entity.HasOne(item => item.Coach)
                .WithMany(user => user.Students)
                .HasForeignKey(item => item.CoachId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(item => item.Student)
                .WithMany(user => user.Coaches)
                .HasForeignKey(item => item.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StudentGroup>(entity =>
        {
            entity.HasOne(item => item.Student)
                .WithMany(student => student.StudentGroups)
                .HasForeignKey(item => item.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(item => item.Group)
                .WithMany(group => group.StudentGroups)
                .HasForeignKey(item => item.GroupId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ClientTraining>(entity =>
        {
            entity.HasOne(item => item.ClientInfo)
                .WithMany(clientInfo => clientInfo.ClientTrainings)
                .HasForeignKey(item => item.ClientInfoId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(item => item.Training)
                .WithMany(training => training.ClientTrainings)
                .HasForeignKey(item => item.TrainingId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
