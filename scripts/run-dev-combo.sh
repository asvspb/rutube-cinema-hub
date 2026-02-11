#!/usr/bin/env bash

# Простой скрипт "одной кнопкой" для запуска Vite и backend серверов,
# тестирования функций и перезапуска backend при изменениях

set -euo pipefail

# Проверяем зависимости
if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required" >&2
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required" >&2
  exit 1
fi

# Устанавливаем необходимые зависимости, если они не установлены
if ! npm list --depth=0 | grep -q "concurrently\|nodemon"; then
  echo "Installing dependencies..."
  npm install --no-save concurrently nodemon
fi

echo "Starting Rutube Cinema Hub development servers..."
echo "Vite on http://localhost:9229"
echo "Backend on http://localhost:9230"

# Запускаем оба сервера параллельно
npx concurrently \
  --names "VITE,BACKEND" \
  --prefix name \
  --prefix-colors "blue,yellow" \
  --kill-others-on-fail \
  "npm run dev" \
  "npx nodemon --watch server/index.js --watch server/ --watch .env server/index.js"

# После запуска серверов, запускаем тестирование
echo "Running smoke tests..."
sleep 5  # Даем время серверам запуститься

# Проверяем доступность серверов
if curl -sf http://localhost:9229/ >/dev/null 2>&1; then
  echo "✓ Frontend (Vite) server is running"
else
  echo "✗ Frontend (Vite) server is not accessible"
fi

if curl -sf http://localhost:9230/ >/dev/null 2>&1; then
  echo "✓ Backend server is running"
else
  echo "✗ Backend server is not accessible"
fi

# Запускаем существующий smoke тест
npm run test