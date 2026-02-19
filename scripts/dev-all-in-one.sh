#!/usr/bin/env bash

# Расширенный скрипт "одной кнопкой" для запуска Vite и backend серверов,
# тестирования функций и перезапуска backend при изменениях

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Функция для вывода сообщений с цветами
print_info() {
  echo -e "\033[1;34m[i]\033[0m $1"
}

print_success() {
  echo -e "\033[1;32m[✓]\033[0m $1"
}

print_error() {
  echo -e "\033[1;31m[✗]\033[0m $1"
}

print_warning() {
  echo -e "\033[1;33m[!]\033[0m $1"
}

# Проверяем наличие необходимых зависимостей
check_dependencies() {
  print_info "Проверка зависимостей..."

  if ! command -v npm >/dev/null 2>&1; then
    print_error "npm is required to run this script"
    exit 1
  fi

  if ! command -v npx >/dev/null 2>&1; then
    print_error "npx is required to run this script"
    exit 1
  fi

  # Проверяем, установлен ли concurrently
  if ! npx --yes concurrently --version >/dev/null 2>&1; then
    print_info "Установка concurrently..."
    npm install --no-save concurrently
  fi

  # Проверяем, установлен ли nodemon
  if ! npx nodemon --version >/dev/null 2>&1; then
    print_info "Установка nodemon..."
    npm install --no-save nodemon
  fi
}

# Функция для тестирования функциональных элементов
test_functionality() {
  print_info "Тестирование функциональных элементов..."

  # Проверяем dev сервер (Vite)
  APP_URL="http://localhost:9229/"
  print_info "Проверка Vite сервера на $APP_URL..."
  
  # Используем timeout для предотвращения зависания
  if timeout 10 curl -sf -o /dev/null "$APP_URL"; then
    print_success "Vite сервер работает (порт 9229)"
  else
    print_error "Vite сервер недоступен (порт 9229)"
  fi

  # Проверяем backend сервер
  BACKEND_URL="http://localhost:9230/"
  print_info "Проверка backend сервера на $BACKEND_URL..."
  
  if timeout 10 curl -sf -o /dev/null "$BACKEND_URL"; then
    print_success "Backend сервер работает (порт 9230)"
  else
    print_error "Backend сервер недоступен (порт 9230)"
  fi

  # Проверяем proxy endpoint
  PROXY_URL="http://localhost:9230/api/proxy?url=https://rutube.ru/api/metainfo/"
  print_info "Проверка backend прокси на $PROXY_URL..."
  
  PROXY_STATUS=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" "$PROXY_URL" 2>/dev/null || echo "000")
  if [[ "$PROXY_STATUS" =~ ^(200|400|403|404)$ ]]; then
    print_success "Backend прокси работает (статус: $PROXY_STATUS)"
  else
    print_error "Backend прокси недоступен (статус: $PROXY_STATUS)"
  fi

  # Проверяем KinoRate AI endpoint
  print_info "Проверка KinoRate AI endpoint..."
  
  # Проверяем только доступность endpoint без выполнения реального запроса к API
  AI_STATUS=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -d '{"query":"test"}' \
    http://localhost:9230/api/ai/kinorate/search 2>/dev/null || echo "000")
  
  if [[ "$AI_STATUS" =~ ^(200|400|500)$ ]]; then
    print_success "KinoRate AI endpoint доступен (статус: $AI_STATUS)"
  else
    print_error "KinoRate AI endpoint недоступен (статус: $AI_STATUS)"
  fi

  print_success "Тестирование функциональности завершено."
}

# Функция для запуска всех сервисов
start_services() {
  print_info "Запуск всех сервисов..."

  # Определяем команды для каждого сервиса
  VITE_CMD="npm run dev"
  BACKEND_CMD="npx nodemon --watch server/index.js --watch server/ --watch .env --ext js,json server/index.js"

  # Запускаем все сервисы одновременно с помощью concurrently
  print_info "Запуск Vite (9229) и Backend (9230) серверов..."
  
  npx concurrently \
    --names "VITE,BACKEND" \
    --prefix name \
    --prefix-colors "blue,yellow" \
    --kill-others-on-fail \
    "cd $ROOT_DIR && $VITE_CMD" \
    "cd $ROOT_DIR && $BACKEND_CMD" &
  
  CONCURRENT_PID=$!
  
  # Ждем немного перед тестированием
  sleep 5
  
  # Запускаем тестирование функциональности
  test_functionality
  
  # Ждем завершения процессов
  wait $CONCURRENT_PID
}

# Основная логика скрипта
main() {
  print_info "=== Запуск Kino Club (все в одном) ==="
  print_info "Vite: http://localhost:9229"
  print_info "Backend: http://localhost:9230"
  print_info "=============================================="
  
  check_dependencies
  start_services
}

# Обработка сигналов для корректного завершения
cleanup() {
  print_info "Остановка сервисов..."
  kill 0 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Запуск основной функции
main "$@"