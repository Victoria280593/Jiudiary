# DeployFiles

Файлы развёртывания JiuDiary. Папка находится рядом с `front` и `back`.

```text
DeployFiles/
├── compose/
│   ├── backend/docker-compose.yml
│   ├── frontend/docker-compose.yml
│   └── mssql/docker-compose.yml
├── dokploy/
│   ├── backend-application.md
│   └── frontend-application.md
├── git/README.md
├── scripts/
└── .env.example
```

## Сервисы

| Сервис | Тип Dokploy | Адрес |
|---|---|---|
| MSSQL | Compose | `217.114.15.222:1433` |
| API | Application | `http://217.114.15.222:5136` |
| Frontend | Application | `http://217.114.15.222:3001` |

Swagger: `http://217.114.15.222:5136/swagger/index.html`.

## Создание базы

После запуска контейнера MSSQL выполните через SSMS единственный файл:

```text
back/libs/database/Scripts/create-database.sql
```

Скрипт рассчитан на пустой сервер и создаёт базу `JiuDiary` целиком.

## Ручной запуск Compose

```bash
cp DeployFiles/.env.example DeployFiles/.env

docker compose --env-file DeployFiles/.env \
  -f DeployFiles/compose/mssql/docker-compose.yml up -d

docker compose --env-file DeployFiles/.env \
  -f DeployFiles/compose/backend/docker-compose.yml up -d --build

docker compose --env-file DeployFiles/.env \
  -f DeployFiles/compose/frontend/docker-compose.yml up -d --build
```

Настоящие пароли, JWT-ключи, SSH-ключи и webhook URL нельзя коммитить в Git.

## Dokploy

- API: `dokploy/backend-application.md`.
- Frontend: `dokploy/frontend-application.md`.
- GitHub deploy key и webhook: `git/README.md`.
