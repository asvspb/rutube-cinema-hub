#!/bin/bash

# =============================================================================
# Docker Quick Rebuild Script
# Быстрая пересборка без удаления всех образов системы
# =============================================================================
# Использование: ./scripts/docker-rebuild-quick.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$(dirname "$0")/.." || exit 1

echo -e "${BLUE}Docker Quick Rebuild${NC}\n"

print_header() {
    echo -e "\n${BLUE}>>> $1${NC}\n"
}

# Шаг 1: Остановка
print_header "Остановка контейнеров"
docker-compose down -v
echo -e "${GREEN}✓${NC} Остановлено"

# Шаг 2: Удаление образов проекта
print_header "Удаление образов проекта"
docker images --format "{{.ID}} {{.Repository}}" | grep "rutube-cinema-hub" | awk '{print $1}' | xargs -r docker rmi -f 2>/dev/null || true
echo -e "${GREEN}✓${NC} Образы удалены"

# Шаг 3: Очистка кэша
print_header "Очистка кэша сборки"
docker builder prune -f
echo -e "${GREEN}✓${NC} Кэш очищен"

# Шаг 4: Сборка с --no-cache
print_header "Сборка образов (--no-cache)"
docker-compose build --no-cache
echo -e "${GREEN}✓${NC} Сборка завершена"

# Шаг 5: Запуск
print_header "Запуск контейнеров"
docker-compose up -d
echo -e "${GREEN}✓${NC} Запущено"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Готово!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Frontend: http://localhost:9229"
echo "Backend:  http://localhost:9230"
echo ""
echo "Логи: docker-compose logs -f"
