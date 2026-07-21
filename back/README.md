# JiuDiary backend

Отдельный backend на ASP.NET Core Web API (.NET 10).

## Запуск

```powershell
dotnet run --project JiuDiary.Api
```

По умолчанию API доступно по адресу `http://localhost:5136`.

Swagger UI: `http://localhost:5136/swagger`.

## Временная авторизация

- Логин: `admin@jiudiary.local`
- Пароль: `JiuDiary2026!`
- `POST /api/auth/login` — получить временный bearer-токен.
- `GET /api/auth/me` — получить данные текущего пользователя.
- `POST /api/auth/logout` — отозвать текущий токен.

Токены хранятся только в памяти и пропадают после перезапуска API. Ограничение
на вход — 10 попыток в минуту.

## Связь с Next.js

Next.js обращается к API по серверной переменной `BACKEND_URL` (локально —
`http://localhost:5136`). Bearer-токен не передаётся в клиентский JavaScript:
фронтенд хранит его в `HttpOnly` cookie `backend_session` и проверяет через
`GET /api/auth/me`.

## Следующий этап

`IUserAuthenticator` отделяет API от способа хранения пользователей. При
подключении БД `HardcodedUserAuthenticator` можно заменить реализацией на EF
Core, сохранив маршруты и форматы ответов. Пароли следует хранить не в
зашифрованном виде, а как стойкие хеши с солью (например, Argon2id или bcrypt).
Временные токены затем можно заменить JWT либо серверными сессиями в БД/Redis.
