#!/usr/bin/env bash

# Скрипт "одной кнопкой" для запуска Vite и backend серверов, тестирования функций и перезапуска backend при изменениях

set -euo pipefail

# Проверяем наличие необходимых зависимостей
if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required to run this script" >&2
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required to run this script" >&2
  exit 1
fi

echo "Проверяем установлен ли nodemon..."
if ! npx nodemon --version >/dev/null 2>&1; then
  echo "Устанавливаем nodemon..."
  npm install --no-save nodemon
fi

# Функция для проверки работоспособности серверов
check_servers() {
  echo "Тестирование функциональных элементов..."

  # Проверяем dev сервер (Vite)
  APP_URL="http://localhost:9229/"
  echo "Проверка Vite сервера на $APP_URL..."
  APP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" || echo "000")
  if [ "$APP_STATUS" = "200" ]; then
    echo "✓ Vite сервер работает (статус: $APP_STATUS)"
  else
    echo "✗ Vite сервер недоступен (статус: $APP_STATUS)"
  fi

  # Проверяем proxy на backend сервере
  PROXY_URL="http://localhost:9230/api/proxy?url=https://rutube.ru/channel/32869212/videos/"
  echo "Проверка backend прокси на $PROXY_URL..."
  PROXY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROXY_URL" || echo "000")
  if [ "$PROXY_STATUS" = "200" ]; then
    echo "✓ Backend прокси работает (статус: $PROXY_STATUS)"
  elif [ "$PROXY_STATUS" = "403" ]; then
    # 403 может быть ожидаемым результатом для этого конкретного URL
    echo "⚠ Backend прокси доступен, но запрос заблокирован (статус: $PROXY_STATUS)"
  else
    echo "✗ Backend прокси недоступен (статус: $PROXY_STATUS)"
  fi

  # Проверяем KinoRate AI endpoint
  echo "Проверка KinoRate AI endpoint..."
  AI_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -d '{"query":"test"}' \
    http://localhost:9230/api/ai/kinorate/search 2>/dev/null || echo "000")
  
  if [[ "$AI_STATUS" =~ ^(200|400|500)$ ]]; then
    echo "✓ KinoRate AI endpoint доступен (статус: $AI_STATUS)"
  else
    echo "✗ KinoRate AI endpoint недоступен (статус: $AI_STATUS)"
  fi

  echo "Тестирование завершено."
}

# Функция для запуска тестов после запуска серверов
run_tests() {
  sleep 10  # Ждем 10 секунд для полного запуска серверов
  check_servers
}

# Запускаем Vite сервер в фоне
echo "Запуск Vite сервера на порту 9229..."
npm run dev &
VITE_PID=$!

# Запускаем backend сервер через nodemon для отслеживания изменений
echo "Запуск backend сервера на порту 9230 с отслеживанием изменений..."
npx nodemon server.js &
BACKEND_PID=$!

# Запускаем тестирование в фоне
run_tests &

# Устанавливаем trap для корректной остановки процессов при выходе
trap 'kill $VITE_PID $BACKEND_PID 2>/dev/null; exit' EXIT INT TERM

# Ждем завершения процессов
wait $VITE_PID $BACKEND_PID