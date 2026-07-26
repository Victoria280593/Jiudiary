using Microsoft.EntityFrameworkCore;

namespace JiuDiary.Api.DataBase;

/// <summary>
/// Регистрирует слой доступа к MSSQL в контейнере зависимостей.
/// </summary>
public static class DataBaseExtensions
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
    public static IServiceCollection AddDataBase(
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
