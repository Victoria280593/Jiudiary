# Git-доступ и автодеплой

Репозиторий `Victoria280593/Jiudiary` принадлежит другому личному аккаунту
GitHub. Поэтому GitHub App, созданное от аккаунта администратора-коллаборатора,
не может быть установлено на этот репозиторий без участия владельца.

Для текущего деплоя используется read-only deploy key и обычный Git provider.

## Deploy key

1. В Dokploy откройте **Settings → SSH Keys**.
2. Создайте ключ ED25519.
3. Сохраните приватную часть только в Dokploy.
4. В GitHub откройте **Repository → Settings → Deploy keys**.
5. Добавьте публичную часть ключа.
6. Не включайте **Allow write access**.
7. В Application выберите этот ключ в поле **SSH Key**.

Никогда не добавляйте приватную часть ключа в репозиторий, `.env`, README или
Docker image.

## Webhook

1. В Dokploy откройте приложение **JiuDiary API → Deployments**.
2. Скопируйте **Webhook URL**.
3. В GitHub откройте **Repository → Settings → Webhooks → Add webhook**.
4. Укажите:
   - Payload URL: URL из Dokploy;
   - Content type: `application/json`;
   - Events: `Just the push event`;
   - Active: включено.
5. После сохранения GitHub должен показать `Last delivery was successful`.

Полный webhook URL нельзя коммитить: его токен позволяет инициировать новую
сборку приложения.

## Проверка

После изменения любого файла в `back/**`:

```bash
git add back
git commit -m "Обновить backend"
git push origin master
```

В Dokploy должна автоматически появиться новая запись во вкладке
**Deployments**.
