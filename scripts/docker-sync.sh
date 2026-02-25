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