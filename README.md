# JiuDiary

Репозиторий разделён на два приложения:

- `front` — Next.js frontend;
- `back` — ASP.NET Core Web API.

## Запуск frontend

```powershell
cd front
npm run dev
```

Frontend: `http://localhost:3000`.

## Запуск backend

```powershell
cd back
dotnet run --project JiuDiary.Api
```

Backend: `http://localhost:5136`.
Swagger UI: `http://localhost:5136/swagger`.
