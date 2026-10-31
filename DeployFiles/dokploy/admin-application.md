# JiuDiary Admin в Dokploy

Админка разворачивается отдельным сервисом типа **Application**.

## Git и Docker

| Поле | Значение |
|---|---|
| Name | `JiuDiary Admin` |
| App Name | `jiudiary-admin` |
| Autodeploy | включён |
| Provider | `Git` |
| Repository URL | `git@github.com:Victoria280593/Jiudiary.git` |
| Branch | `test` |
| Build Path | `/back` |
| Watch Paths | `back/admin/**`, `back/libs/DataBase/**`, `back/libs/JiraDiary.AspCore/**` |
| Build Type | `Dockerfile` |
| Docker File | `admin/Dockerfile` |
| Docker Context Path | `/back` |

## Environment

```dotenv
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_HTTP_PORTS=8080
TZ=Europe/Moscow
ConnectionStrings__Default=Server=217.114.15.222,1433;Database=JiuDiary;User Id=sa;Password=CHANGE_ME;Encrypt=True;TrustServerCertificate=True
```

Админка принимает только пользователей с ролью `Admin`. Пароль проверяется по
хешу из `Users.PasswordHash`, сам пароль в репозитории не хранится.

## Порт

В **Advanced → Ports**:

| Поле | Значение |
|---|---|
| Published Port | `5138` |
| Published Port Mode | `Ingress` |
| Target Port | `8080` |
| Protocol | `TCP` |

Адрес после публикации: `http://217.114.15.222:5138`.
