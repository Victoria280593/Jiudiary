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

    public DbSet<ClientTrainingSubmission> ClientTrainingSubmissions => Set<ClientTrainingSubmission>();

    public DbSet<StudentRequest> StudentsRequests => Set<StudentRequest>();

    public DbSet<CoachStudent> CoachStudents => Set<CoachStudent>();

    public DbSet<StudentGroup> StudentGroups => Set<StudentGroup>();

    public override int SaveChanges() => SaveChanges(true);

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ApplyAuditableDates();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => SaveChangesAsync(true, cancellationToken);

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        ApplyAuditableDates();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

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

        modelBuilder.Entity<ClientTrainingSubmission>(entity =>
        {
            entity.HasKey(item => new { item.ClientTrainingId, item.SubmissionId });

            entity.HasOne(item => item.ClientTraining)
                .WithMany(clientTraining => clientTraining.Submissions)
                .HasForeignKey(item => item.ClientTrainingId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(item => item.Submission)
                .WithMany(submission => submission.ClientTrainingSubmissions)
                .HasForeignKey(item => item.SubmissionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.ToTable(table => table.HasCheckConstraint("CK_ClientTrainingSubmissions_Count", "[Count] > 0"));
        });
    }

    private void ApplyAuditableDates()
    {
        var now = DateTime.Now;
        foreach (var entry in ChangeTracker.Entries<IAuditable>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.UpdatedAt = null;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Property(nameof(IAuditable.CreatedAt)).IsModified = false;
                entry.Entity.UpdatedAt = now;
            }
        }
    }
}
