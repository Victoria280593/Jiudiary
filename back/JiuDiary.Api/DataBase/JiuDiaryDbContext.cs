using JiuDiary.Api.DataBase.Entities;
using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.DataBase;

/// <summary>
/// Контекст доступа к основной базе данных JiuDiary.
/// </summary>
/// <param name="options">
/// Настройки EF Core, включая connection string, зарегистрированные в контейнере зависимостей.
/// </param>
public sealed class JiuDiaryDbContext(DbContextOptions<JiuDiaryDbContext> options)
    : DbContext(options)
{
    /// <summary>
    /// Пользователи системы.
    /// </summary>
    public DbSet<User> Users => Set<User>();

    /// <summary>
    /// Роли пользователей.
    /// </summary>
    public DbSet<Role> Roles => Set<Role>();

    /// <summary>
    /// Активные и отозванные refresh-сессии.
    /// </summary>
    public DbSet<AuthSession> AuthSessions => Set<AuthSession>();

    /// <summary>
    /// Настраивает точное соответствие C#-сущностей таблицам и ограничениям MSSQL.
    /// </summary>
    /// <param name="modelBuilder">Конструктор модели EF Core.</param>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Роли имеют заданные вручную INT-идентификаторы и уникальные имена.
        modelBuilder.Entity<Role>(role =>
        {
            role.ToTable("Roles");
            role.HasKey(x => x.Id);
            role.Property(x => x.Id).ValueGeneratedNever();
            role.Property(x => x.Name).HasMaxLength(50).IsRequired();
            role.HasIndex(x => x.Name).IsUnique();
        });

        // Пользователь получает GUID в MSSQL, уникальный логин и одну обязательную роль.
        modelBuilder.Entity<User>(user =>
        {
            user.ToTable("Users");
            user.HasKey(x => x.Id);
            user.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
            user.Property(x => x.Login).HasMaxLength(256).IsRequired();
            user.Property(x => x.Name).HasMaxLength(200).IsRequired();
            user.Property(x => x.PasswordHash).HasMaxLength(512);
            user.Property(x => x.IsActive).HasDefaultValue(true);
            user.HasIndex(x => x.Login).IsUnique();
            user.HasOne(x => x.Role)
                .WithMany(x => x.Users)
                .HasForeignKey(x => x.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // В базе хранится только хеш refresh-токена; сам токен получает клиент.
        modelBuilder.Entity<AuthSession>(session =>
        {
            session.ToTable("AuthSessions");
            session.HasKey(x => x.Id);
            session.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
            session.Property(x => x.RefreshTokenHash).HasMaxLength(64).IsFixedLength().IsRequired();
            session.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            session.HasIndex(x => x.RefreshTokenHash).IsUnique();
            session.HasOne(x => x.User)
                .WithMany(x => x.AuthSessions)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
