# DeployFiles

Файлы развёртывания JIUDIARY. Папка находится рядом с `front` и `back`.

## Структура

```text
DeployFiles/
├── compose/
│   └── mssql/
│       └── docker-compose.yml
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

## Вариант 1: развёртывание через Dokploy

Для этого варианта папку `DeployFiles` копировать на VPS не нужно:

1. Откройте проект в Dokploy и создайте сервис типа **Compose**.
2. Выберите провайдер **Raw**.
3. Скопируйте содержимое `compose/mssql/docker-compose.yml` из локального репозитория в редактор Dokploy.
4. В разделе **Environment** добавьте значения из `.env.example`, заменив пароль.
5. Нажмите **Deploy**.
6. Выполните `sql/001-create-users-and-roles.sql` через SSMS или терминал контейнера.

## Вариант 2: ручной запуск на VPS

Сначала репозиторий нужно клонировать или скопировать на сервер. Пример после клонирования:

```bash
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ> jiudiary
cd jiudiary/DeployFiles
cp .env.example .env
nano .env
docker compose --env-file .env -f compose/mssql/docker-compose.yml up -d
bash scripts/init-mssql.sh
```

В `.env` обязательно замените `MSSQL_SA_PASSWORD`. Файл `.env` исключён из Git, реальный пароль коммитить нельзя.

Скрипт инициализации создаёт базу `JiuDiary`, таблицы `Roles` и `Users`, а также роль `Admin` с `Id = 1`.

## Установка Docker и Dokploy

Скрипты рассчитаны на чистый Ubuntu VPS:

```bash
sudo bash DeployFiles/scripts/install-docker-ubuntu.sh
sudo bash DeployFiles/scripts/install-dokploy.sh 217.114.15.222
```

Dokploy будет доступен по адресу `http://IP_СЕРВЕРА:3000`. Его официальный установщик сам умеет устанавливать Docker, поэтому отдельный Docker-скрипт нужен только для ручной установки.

## Firewall и подключение через SSMS

Скрипт можно запускать только после копирования репозитория на VPS. Разрешите `1433` только для своего внешнего IP:

```bash
sudo bash DeployFiles/scripts/configure-firewall.sh ВАШ_ВНЕШНИЙ_IP
```

Скрипт использует цепочку Docker `DOCKER-USER`, потому что опубликованные Docker-порты могут обходить обычные правила UFW. Если на VPS есть отдельный firewall у хостинг-провайдера, добавьте такое же ограничение и там. Для сохранения правил после перезагрузки установите `iptables-persistent`.

Проверка порта с Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\DeployFiles\scripts\check-mssql-port.ps1 -ServerIp 217.114.15.222
```

Настройки SSMS:

- Server name: `217.114.15.222,1433`
- Authentication: `SQL Server Authentication`
- Login: `sa`
- Database: `JiuDiary`
- Encrypt: включено
- Trust server certificate: включено для первичной настройки

Не открывайте порт `1433` для всего интернета. Для постоянной эксплуатации лучше использовать VPN или SSH-туннель и отдельного SQL-пользователя вместо `sa`.
