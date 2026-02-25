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

# Проверка API
echo "Checking API health..."
sleep 2
HEALTH=$(curl -s http://localhost:9230/api/health)
if echo "$HEALTH" | grep -q '"status"'; then
  echo "✅ API is responding"
  echo "$HEALTH"
else
  echo "❌ API not responding properly"
  exit 1
fi

echo "✅ Verification complete!"