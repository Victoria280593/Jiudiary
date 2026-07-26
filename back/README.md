# JiuDiary API

ASP.NET Core Web API на .NET 10.

## База данных

EF Core работает через `DataBase/JiuDiaryDbContext.cs` и строку подключения
`ConnectionStrings:Default`.

Для пустого MSSQL выполните единственный скрипт:

`JiuDiary.Api/DataBase/Scripts/create-database.sql`

Он создаёт базу `JiuDiary`, таблицы `Roles`, `Users`, `AuthSessions`, роль `Admin`
и пользователя `admin@jiudiary.local`.

## Авторизация

- `POST /api/auth/register` создаёт активного тренера с ролью `Coach`, сохраняя только хеш пароля.
- `POST /api/auth/login` проверяет пользователя в MSSQL и возвращает JWT access-токен
  и одноразовый refresh-токен.
- `POST /api/auth/refresh` выполняет ротацию refresh-токена и возвращает новую пару.
- `GET /api/auth/me` возвращает текущего пользователя по JWT.
- `POST /api/auth/logout` отзывает refresh-сессию.

Access-токен живёт 15 минут. Refresh-сессия живёт 30 дней и хранится в
`dbo.AuthSessions`; в базе сохраняется только SHA-256-хеш токена.

Пароли пользователей хранятся в `dbo.Users.PasswordHash` в формате стандартного
ASP.NET Core Identity `PasswordHasher`.

## Переменные окружения

```dotenv
ConnectionStrings__Default=Server=localhost,1433;Database=JiuDiary;User Id=sa;Password=...;Encrypt=True;TrustServerCertificate=True
Jwt__Issuer=JiuDiary
Jwt__Audience=JiuDiary.Api
Jwt__SigningKey=replace-with-at-least-32-random-characters
AuthBootstrap__Enabled=true
AuthBootstrap__Login=admin@jiudiary.local
AuthBootstrap__Password=temporary-initial-password
Cors__FrontendOrigins__0=http://localhost:3000
```

Bootstrap используется только для первого заполнения `PasswordHash` существующего
администратора. После первого успешного входа установите
`AuthBootstrap__Enabled=false` и удалите bootstrap-пароль из окружения.

## Запуск

```powershell
dotnet run --project JiuDiary.Api
```

Swagger UI: `http://localhost:5136/swagger`.
