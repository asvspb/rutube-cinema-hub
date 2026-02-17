#!/bin/bash

# =============================================================================
# Docker Full Rebuild Script
# Полная очистка и пересборка Docker окружения с нуля
# =============================================================================
# 
# Что делает:
# 1. Останавливает все контейнеры
# 2. Удаляет контейнеры, сети, тома
# 3. Удаляет Docker образы
# 4. Очищает кэш Docker build
# 5. Пересобирает и запускает проект заново
#
# Использование:
#   ./scripts/docker-rebuild-full.sh
#   ./scripts/docker-rebuild-full.sh --skip-build  # только очистка, без запуска
# =============================================================================

set -e  # Выход при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для печати заголовков
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Функция для печати статуса
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Перехват Ctrl+C
trap 'echo -e "\n${YELLOW}Прервано пользователем${NC}"; exit 1' INT

# Проверка флага --skip-build
SKIP_BUILD=false
if [[ "$1" == "--skip-build" ]]; then
    SKIP_BUILD=true
fi

# Переход в директорию проекта
cd "$(dirname "$0")/.." || exit 1

echo -e "${YELLOW}Docker Full Rebuild Script${NC}"
echo "Путь к проекту: $(pwd)"
echo ""

# Предупреждение
print_warning "ВНИМАНИЕ: Это действие удалит ВСЕ Docker образы, контейнеры и тома!"
echo "Включая данные из других проектов, если они используют те же имена."
echo ""

if [[ "$SKIP_BUILD" == "false" ]]; then
    read -p "Продолжить? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Отменено пользователем"
        exit 0
    fi
fi

# =============================================================================
# Шаг 1: Остановка контейнеров
# =============================================================================
print_header "Шаг 1: Остановка контейнеров"

if docker-compose ps -q 2>/dev/null | grep -q .; then
    docker-compose down
    print_status "Контейнеры остановлены"
else
    print_warning "Нет активных контейнеров"
fi

# =============================================================================
# Шаг 2: Удаление контейнеров, сетей и томов проекта
# =============================================================================
print_header "Шаг 2: Удаление контейнеров, сетей и томов проекта"

docker-compose down -v --remove-orphans 2>/dev/null || true
print_status "Контейнеры, сети и тома проекта удалены"

# =============================================================================
# Шаг 3: Удаление образов проекта
# =============================================================================
print_header "Шаг 3: Удаление Docker образов проекта"

# Получаем список образов проекта
PROJECT_IMAGES=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "rutube-cinema-hub|node:20-alpine" || true)

if [[ -n "$PROJECT_IMAGES" ]]; then
    echo "Найдены образы для удаления:"
    echo "$PROJECT_IMAGES"
    echo ""
    
    # Удаляем образы
    docker images --format "{{.ID}} {{.Repository}}:{{.Tag}}" | grep -E "rutube-cinema-hub" | awk '{print $1}' | xargs -r docker rmi -f 2>/dev/null || true
    print_status "Образы проекта удалены"
else
    print_warning "Образы проекта не найдены"
fi

# =============================================================================
# Шаг 4: Очистка кэша Docker build
# =============================================================================
print_header "Шаг 4: Очистка кэша Docker build"

docker builder prune -f
print_status "Кэш сборки очищен"

# =============================================================================
# Шаг 5: Полная очистка системы (опционально)
# =============================================================================
print_header "Шаг 5: Глубокая очистка Docker системы"

echo "Этот шаг удалит:"
echo "  - Все неиспользуемые образы (dangling и unused)"
echo "  - Все неиспользуемые сети"
echo "  - Все build cache"
echo ""

if [[ "$SKIP_BUILD" == "false" ]]; then
    read -p "Выполнить глубокую очистку? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker system prune -a -f --volumes
        print_status "Глубокая очистка завершена"
    else
        print_warning "Пропущено"
    fi
fi

# =============================================================================
# Шаг 6: Проверка окружения
# =============================================================================
print_header "Шаг 6: Проверка окружения"

# Проверка .env файла
if [[ ! -f ".env" ]]; then
    print_warning "Файл .env не найден!"
    if [[ -f ".env.example" ]]; then
        echo "Копируем .env.example в .env..."
        cp .env.example .env
        print_status "Создан файл .env из шаблона"
        print_warning "Не забудьте настроить параметры в файле .env!"
    fi
else
    print_status "Файл .env найден"
fi

# Проверка Docker
if ! docker --version >/dev/null 2>&1; then
    print_error "Docker не найден!"
    exit 1
fi
print_status "Docker: $(docker --version)"

# Проверка Docker Compose
if ! docker-compose --version >/dev/null 2>&1; then
    print_error "Docker Compose не найден!"
    exit 1
fi
print_status "Docker Compose: $(docker-compose --version)"

# =============================================================================
# Шаг 7: Сборка и запуск (если не --skip-build)
# =============================================================================
if [[ "$SKIP_BUILD" == "false" ]]; then
    print_header "Шаг 7: Сборка образов с --no-cache"
    
    docker-compose build --no-cache
    print_status "Сборка завершена"
    
    print_header "Шаг 8: Запуск контейнеров"
    
    docker-compose up -d
    print_status "Контейнеры запущены"
    
    print_header "Готово!"
    
    echo -e "${GREEN}Проект успешно развернут!${NC}"
    echo ""
    echo "Полезные команды:"
    echo "  docker-compose ps          # Статус контейнеров"
    echo "  docker-compose logs -f     # Просмотр логов"
    echo "  docker-compose down        # Остановка контейнеров"
    echo "  docker-compose restart     # Перезапуск контейнеров"
    echo ""
    echo "Доступ к приложению:"
    echo "  Frontend: http://localhost:9229"
    echo "  Backend:  http://localhost:9230"
    echo ""
else
    print_header "Очистка завершена!"
    print_warning "Сборка пропущена (--skip-build)"
    echo ""
    echo "Для запуска выполните:"
    echo "  docker-compose build --no-cache"
    echo "  docker-compose up -d"
fi
