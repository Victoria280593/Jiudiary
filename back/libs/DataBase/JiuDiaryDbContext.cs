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

    public DbSet<Group> Groups => Set<Group>();

    public DbSet<GroupColor> Colors => Set<GroupColor>();

    public DbSet<CoachGroup> CoachGroups => Set<CoachGroup>();

    public DbSet<Training> Trainings => Set<Training>();
}
