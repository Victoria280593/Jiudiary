namespace JiuDiary.Admin.Models;

public sealed class TopologyViewModel
{
    public IReadOnlyList<TopologyItemViewModel> Items { get; init; } = [];

    public static TopologyViewModel Create() => new()
    {
        Items =
        [
            new("Тест", "Frontend", "http://217.114.15.222:3002", "3002", "Клиентское приложение", "test"),
            new("Тест", "API", "http://217.114.15.222:5137", "5137", "Backend API и Swagger", "test"),
            new("Тест", "Admin", "http://217.114.15.222:5138", "5138", "Админка JiuDiary", "test"),
            new("Прод", "Frontend", "http://217.114.15.222:3001", "3001", "Клиентское приложение", "production"),
            new("Прод", "API", "http://217.114.15.222:5136", "5136", "Backend API и Swagger", "production"),
            new("Общее", "MSSQL", "217.114.15.222:1433", "1433", "База данных JiuDiary", "shared")
        ]
    };
}

public sealed record TopologyItemViewModel(
    string Environment,
    string Service,
    string Address,
    string Port,
    string Description,
    string EnvironmentKey);
