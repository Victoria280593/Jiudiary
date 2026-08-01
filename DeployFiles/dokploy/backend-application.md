# JiuDiary API в Dokploy

Backend развёртывается как отдельный сервис типа **Application**.

## Git и Docker

| Поле | Значение |
|---|---|
| Name | `JiuDiary API` |
| App Name | `jiudiary-api` |
| Autodeploy | включён |
| Provider | `Git` |
| Repository URL | `git@github.com:Victoria280593/Jiudiary.git` |
| Branch | `master` |
| Build Path | `/back` |
| Watch Paths | `back/**` |
| Build Type | `Dockerfile` |
| Docker File | `api/Dockerfile` |
| Docker Context Path | `/back` |

## Environment

```dotenv
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_HTTP_PORTS=8080
JIUDIARY_LOG_DIRECTORY=/logs/jiuDiary
ConnectionStrings__Default=Server=217.114.15.222,1433;Database=JiuDiary;User Id=sa;Password=CHANGE_ME;Encrypt=True;TrustServerCertificate=True
Jwt__Issuer=JiuDiary
Jwt__Audience=JiuDiary.Api
Jwt__SigningKey=CHANGE_TO_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS
Jwt__AccessTokenMinutes=15
Jwt__RefreshTokenDays=30
AuthBootstrap__Enabled=true
AuthBootstrap__Login=admin@jiudiary.local
AuthBootstrap__Password=CHANGE_ME
Cors__FrontendOrigins__0=http://217.114.15.222:3001
```

## Логи на сервере

Перед первым деплоем создайте каталог на сервере и выдайте его пользователю контейнера:

```bash
sudo install -d -m 0775 -o 1654 -g 1654 /logs/jiuDiary
```

В Dokploy добавьте bind mount:

| Поле | Значение |
|---|---|
| Host Path | `/logs/jiuDiary` |
| Mount Path | `/logs/jiuDiary` |

Файлы создаются в формате `/logs/jiuDiary/YYYY-MM-DD.log`.

JWT-ключ и пароли нельзя коммитить в Git. Сгенерировать JWT-ключ на сервере:

```bash
openssl rand -base64 48
```

После первого успешного входа администратора API заполнит
`Users.PasswordHash`. Затем установите:

```dotenv
AuthBootstrap__Enabled=false
AuthBootstrap__Login=
AuthBootstrap__Password=
```

## Порт

В **Advanced → Ports**:

| Поле | Значение |
|---|---|
| Published Port | `5136` |
| Published Port Mode | `Ingress` |
| Target Port | `8080` |
| Protocol | `TCP` |

- Swagger: `http://217.114.15.222:5136/swagger/index.html`
- Health check: `http://217.114.15.222:5136/api/health`

После появления домена замените IP-адреса на HTTPS-адреса.
