using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace JiuDiary.Database;

/// <summary>
/// Регистрирует слой доступа к MSSQL в контейнере зависимостей.
/// </summary>
public static class DatabaseExtensions
{
    /// <summary>
    /// Читает `ConnectionStrings:Default` и подключает <see cref="JiuDiaryDbContext"/>.
    /// </summary>
    /// <param name="services">Коллекция сервисов приложения.</param>
    /// <param name="configuration">Конфигурация приложения.</param>
    /// <returns>Та же коллекция сервисов для последовательной настройки.</returns>
    /// <exception cref="InvalidOperationException">
    /// Выбрасывается, если строка подключения отсутствует.
    /// </exception>
    public static IServiceCollection AddDatabase(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("ConnectionStrings:Default is required.");
        }

        services.AddDbContext<JiuDiaryDbContext>(
            options => options.UseSqlServer(connectionString));
        return services;
    }
}
