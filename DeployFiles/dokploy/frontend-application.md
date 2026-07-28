# JiuDiary frontend в Dokploy

Frontend развёртывается как отдельный сервис типа **Application**.

## Основные параметры

| Поле | Значение |
|---|---|
| Name | `JiuDiary Frontend` |
| App Name | `jiudiary-frontend` |
| Autodeploy | Включён |
| Provider | `Git` |
| Repository URL | `git@github.com:Victoria280593/Jiudiary.git` |
| Branch | `master` |
| Build Path | `/front` |
| Watch Paths | `front/**` |
| SSH Key | read-only deploy key для JIUDIARY |
| Build Type | `Dockerfile` |
| Docker File | `Dockerfile` |
| Docker Context Path | `/front` |
| Docker Build Stage | пусто |

## Environment

```dotenv
DATABASE_URL=file:/app/data/app.db
BACKEND_URL=http://217.114.15.222:5136
APP_URL=http://217.114.15.222:3001
```

`BACKEND_URL` используется сервером Next.js. Он не попадает в клиентский
JavaScript.

## Порт

В разделе **Advanced → Ports**:

| Поле | Значение |
|---|---|
| Published Port | `3001` |
| Published Port Mode | `Ingress` |
| Target Port | `3000` |
| Protocol | `TCP` |

## Постоянные данные

В разделе **Advanced → Volumes** добавьте:

| Тип | Mount Path | Назначение |
|---|---|---|
| Volume | `/app/data` | временная SQLite-база frontend |
| Volume | `/app/public/avatars` | загруженные аватары |

SQLite используется временно, пока оставшиеся данные не перенесены в
backend/MSSQL. Авторизация уже выполняется через отдельный backend API.

## Автодеплой

Используется тот же GitHub webhook, что описан в `../git/README.md`. При push в
`master` Dokploy пересобирает frontend только при изменениях `front/**`.
