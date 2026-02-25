# Техническое задание: Синхронизация изменений в Docker

## Проблема

При разработке в Docker контейнеры часто не подхватывают изменения:

- Изменения Prisma схемы не применяются автоматически
- Миграции не синхронизируются между хостом и контейнером
- Prisma Client не регенерируется

## Решение: Скрипт синхронизации

### 1. Создать скрипт `scripts/docker-sync.sh`

```bash
#!/usr/bin/env bash
# Синхронизация изменений Prisma в Docker контейнере
# Использование: ./scripts/docker-sync.sh [container-name]

set -euo pipefail

CONTAINER="${1:-rutube-cinema-hub-backend-dev-1}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🔄 Syncing Prisma changes to Docker container: $CONTAINER"

# 1. Генерация schema.prisma из schema.base.prisma
echo "📋 Generating schema.prisma..."
bash "$ROOT_DIR/scripts/generate-prisma-schemas.sh"

# 2. Копирование schema.prisma в контейнер
echo "📦 Copying schema.prisma to container..."
docker cp "$ROOT_DIR/prisma/schema.prisma" "$CONTAINER:/app/prisma/schema.prisma"

# 3. Копирование миграций (если есть новые)
echo "📦 Copying migrations to container..."
docker cp "$ROOT_DIR/prisma/migrations/." "$CONTAINER:/app/prisma/migrations/"

# 4. Генерация Prisma Client в контейнере
echo "⚙️  Generating Prisma Client in container..."
docker exec "$CONTAINER" npx prisma generate

# 5. Применение изменений к БД
echo "🗄️  Syncing database schema..."
docker exec "$CONTAINER" npx prisma db push

# 6. Перезапуск сервера
echo "🔄 Restarting server..."
docker restart "$CONTAINER"

echo "✅ Sync complete! Wait 5-10 seconds for server to start."
```

### 2. Сделать скрипт исполняемым

```bash
chmod +x scripts/docker-sync.sh
```

### 3. Добавить npm script в `package.json`

```json
{
  "scripts": {
    "docker:sync": "bash scripts/docker-sync.sh",
    "docker:sync:restart": "bash scripts/docker-sync.sh && sleep 8 && curl -s http://localhost:9230/api/health"
  }
}
```

## Автоматическая проверка

### Скрипт проверки `scripts/docker-verify.sh`

```bash
#!/usr/bin/env bash
# Проверка синхронизации Docker
set -euo pipefail

CONTAINER="${1:-rutube-cinema-hub-backend-dev-1}"

echo "🔍 Verifying Docker sync..."

# Проверка schema.prisma
echo "Checking schema.prisma..."
LOCAL_SCHEMA=$(cat prisma/schema.prisma | grep -A2 "model User")
DOCKER_SCHEMA=$(docker exec "$CONTAINER" cat prisma/schema.prisma | grep -A2 "model User")

if [ "$LOCAL_SCHEMA" != "$DOCKER_SCHEMA" ]; then
  echo "❌ schema.prisma out of sync!"
  echo "Local: $LOCAL_SCHEMA"
  echo "Docker: $DOCKER_SCHEMA"
  exit 1
fi
echo "✅ schema.prisma in sync"

# Проверка Prisma Client
echo "Checking Prisma Client..."
docker exec "$CONTAINER" npx prisma generate --check 2>/dev/null || {
  echo "⚠️  Prisma Client needs regeneration"
}

# Проверка API
echo "Checking API health..."
sleep 3
curl -s http://localhost:9230/api/health | jq . || echo "❌ API not responding"

echo "✅ Verification complete!"
```

## Когда использовать

### Обязательно запускать после:

1. **Изменения Prisma схемы** (`prisma/schema.base.prisma`)

   ```bash
   npm run docker:sync
   ```

2. **Создания новой миграции**

   ```bash
   npx prisma migrate dev --name your_migration
   npm run docker:sync
   ```

3. **Изменения backend кода** (при использовании volume)
   - Сервер перезапустится автоматически через nodemon
   - Если нет - выполнить `docker restart rutube-cinema-hub-backend-dev-1`

### Диагностика проблем

```bash
# Проверить логи контейнера
docker logs rutube-cinema-hub-backend-dev-1 --tail 50

# Проверить статус миграций
docker exec rutube-cinema-hub-backend-dev-1 npx prisma migrate status

# Проверить схему БД
docker exec rutube-cinema-hub-backend-dev-1 npx prisma db push --force-reset

# Полная пересборка
docker-compose down -v
docker-compose up -d --build
npm run docker:sync
```

## Интеграция с CI/CD

Добавить в `docker-compose.yml` healthcheck:

```yaml
services:
  backend-dev:
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:9230/api/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

## Чек-лист для разработчика

- [ ] После изменения `schema.base.prisma` → запустить `npm run docker:sync`
- [ ] После создания миграции → запустить `npm run docker:sync`
- [ ] При ошибках Prisma Client → проверить синхронизацию схем
- [ ] При ошибках API → проверить логи и перезапустить контейнер
