# DeployFiles

Файлы и инструкции для развёртывания JIUDIARY. Папка находится на одном уровне
с `front` и `back`.

## Структура

```text
DeployFiles/
├── compose/
│   ├── backend/
│   │   └── docker-compose.yml
│   └── mssql/
│       └── docker-compose.yml
├── dokploy/
│   └── backend-application.md
├── git/
│   └── README.md
├── scripts/
│   ├── check-mssql-port.ps1
│   ├── configure-firewall.sh
│   ├── init-mssql.sh
│   ├── install-docker-ubuntu.sh
│   └── install-dokploy.sh
├── sql/
│   └── 001-create-users-and-roles.sql
└── .env.example
```

## Что сейчас развёрнуто

| Сервис | Тип в Dokploy | Внешний адрес |
|---|---|---|
| MSSQL | Compose | `217.114.15.222:1433` |
| JiuDiary API | Application | `http://217.114.15.222:5136` |

Swagger API:

```text
http://217.114.15.222:5136/swagger/index.html
```

Health check:

```text
http://217.114.15.222:5136/api/health
```

## Развёртывание через Dokploy

- MSSQL создаётся как сервис типа **Compose** из
  `compose/mssql/docker-compose.yml`.
- Backend создаётся как отдельный сервис типа **Application**. Полный список
  значений для Git, Dockerfile, портов и автодеплоя находится в
  `dokploy/backend-application.md`.
- Настройка read-only deploy key и GitHub webhook описана в `git/README.md`.

Копировать папку `DeployFiles` на VPS при таком варианте не нужно: Dokploy сам
клонирует репозиторий и собирает контейнер.

## Ручной запуск через Docker Compose

Сначала клонируйте репозиторий:

```bash
git clone <URL_РЕПОЗИТОРИЯ> jiudiary
cd jiudiary
cp DeployFiles/.env.example DeployFiles/.env
nano DeployFiles/.env
```

Запуск MSSQL:

```bash
docker compose \
  --env-file DeployFiles/.env \
  -f DeployFiles/compose/mssql/docker-compose.yml \
  up -d
```

Запуск backend:

```bash
docker compose \
  --env-file DeployFiles/.env \
  -f DeployFiles/compose/backend/docker-compose.yml \
  up -d --build
```

Файл `DeployFiles/.env` нельзя добавлять в Git. Настоящие пароли, приватные
SSH-ключи и полный URL webhook также нельзя хранить в репозитории.

## Установка Docker и Dokploy

Скрипты рассчитаны на Ubuntu VPS:

```bash
sudo bash DeployFiles/scripts/install-docker-ubuntu.sh
sudo bash DeployFiles/scripts/install-dokploy.sh 217.114.15.222
```

Панель Dokploy будет доступна по адресу:

```text
http://217.114.15.222:3000
```

## Инициализация MSSQL

После запуска MSSQL:

```bash
bash DeployFiles/scripts/init-mssql.sh
```

Либо выполните `sql/001-create-users-and-roles.sql` через SSMS.

Проверка порта с Windows:

```powershell
powershell -ExecutionPolicy Bypass `
  -File .\DeployFiles\scripts\check-mssql-port.ps1 `
  -ServerIp 217.114.15.222
```

Не открывайте MSSQL-порт `1433` для всего интернета. Ограничьте его своим IP,
VPN или SSH-туннелем.
