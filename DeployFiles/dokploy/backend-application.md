# JiuDiary API в Dokploy

Backend развёртывается как отдельный сервис типа **Application**, а не как часть
MSSQL Compose. Это позволит позднее создавать несколько независимых API: у
каждого будут собственные Dockerfile, сервис, порт и политика автодеплоя.

## Основные параметры

| Поле | Значение |
|---|---|
| Name | `JiuDiary API` |
| App Name | `jiudiary-api` |
| Autodeploy | Включён |
| Provider | `Git` |
| Repository URL | `git@github.com:Victoria280593/Jiudiary.git` |
| Branch | `master` |
| Build Path | `/back` |
| Watch Paths | `back/**` |
| SSH Key | read-only deploy key для JIUDIARY |
| Build Type | `Dockerfile` |
| Docker File | `JiuDiary.Api/Dockerfile` |
| Docker Context Path | `/back` |
| Docker Build Stage | пусто |

## Порт

В разделе **Advanced → Ports**:

| Поле | Значение |
|---|---|
| Published Port | `5136` |
| Published Port Mode | `Ingress` |
| Target Port | `8080` |
| Protocol | `TCP` |

После деплоя:

- Swagger: `http://217.114.15.222:5136/swagger/index.html`
- Health check: `http://217.114.15.222:5136/api/health`

## Автоматическое обновление

1. Разработчик отправляет изменения в ветку `master`.
2. GitHub отправляет событие `push` в webhook Dokploy.
3. Dokploy клонирует репозиторий через read-only deploy key.
4. Если изменились файлы `back/**`, Dokploy собирает новый Docker-образ.
5. После успешной сборки Dokploy заменяет контейнер приложения.

Webhook URL берётся из вкладки **Deployments** приложения. Не записывайте его
полностью в Git: URL содержит токен, позволяющий запускать деплой.

## Откат

Предыдущие сборки отображаются во вкладке **Deployments**. Настройки rollback
задаются через **Configure Rollbacks**. Перед изменением Dockerfile или версии
.NET убедитесь, что последняя рабочая сборка сохранена в истории.
