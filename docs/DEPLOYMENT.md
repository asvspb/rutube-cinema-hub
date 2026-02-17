# Руководство по деплою Rutube Cinema Hub

## Содержание

- [Требования](#требования)
- [Режимы работы](#режимы-работы)
- [Development режим](#development-режим)
- [Production режим](#production-режим)
- [Переменные окружения](#переменные-окружения)
- [Health Checks](#health-checks)
- [Мониторинг и логи](#мониторинг-и-логи)
- [Устранение неполадок](#устранение-неполадок)

---

## Требования

- Docker Engine 20.10+
- Docker Compose 2.0+
- 512MB+ RAM для контейнеров
- Порт 9229 (frontend dev) и 9230 (backend)

---

## Режимы работы

Проект поддерживает два профиля Docker Compose:

| Профиль | Описание                                    | Команда запуска                    |
| ------- | ------------------------------------------- | ---------------------------------- |
| `dev`   | Режим разработки с hot-reload               | `docker-compose up`                |
| `prod`  | Production-режим с оптимизированным образом | `docker-compose --profile prod up` |

---

## Development режим

### Быстрый старт

```bash
# Клонирование репозитория
git clone <repo-url>
cd rutube-cinema-hub

# Создание .env файла
cp .env.example .env
# Отредактируйте .env с вашими API ключами

# Запуск в режиме разработки
docker-compose up
```

### Особенности dev-режима

- **Hot Reload**: Frontend и backend автоматически перезапускаются при изменении файлов
- **Volumes**: Исходный код монтируется в контейнеры
- **Nodemon**: Backend использует nodemon для отслеживания изменений
- **Vite HMR**: Frontend поддерживает Hot Module Replacement

### Структура сервисов (dev)

```
┌─────────────────┐     ┌─────────────────┐
│  frontend-dev   │────▶│   backend-dev   │
│   (port 9229)   │     │   (port 9230)   │
│   Vite + HMR    │     │  Nodemon + Dev  │
└─────────────────┘     └─────────────────┘
```

### Команды для dev

```bash
# Запуск в фоне
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Просмотр логов конкретного сервиса
docker-compose logs -f frontend-dev
docker-compose logs -f backend-dev

# Остановка
docker-compose down

# Полная очистка (включая volumes)
docker-compose down -v
```

---

## Production режим

### Сборка и запуск

```bash
# Создание .env файла
cp .env.example .env
# Отредактируйте .env с production-значениями

# Сборка и запуск production-контейнера
docker-compose --profile prod up --build -d
```

### Multi-stage Dockerfile

Проект использует multi-stage Dockerfile для оптимизации:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     deps     │────▶│    builder   │────▶│  production  │
│ Dependencies │     │ Build dist/  │     │ Node + dist  │
│   (cached)   │     │ Prune devDeps│     │  Non-root    │
└──────────────┘     └──────────────┘     └──────────────┘
```

#### Stage 1: deps

- Кэширует `node_modules` при неизменных `package*.json`
- Устанавливает все зависимости (включая devDependencies)

#### Stage 2: builder

- Копирует исходный код
- Выполняет `npm run build` → создаёт `dist/`
- Удаляет devDependencies через `npm prune --production`

#### Stage 3: production

- Минимальный образ на базе `node:20-alpine`
- Только production-зависимости
- Непривилегированный пользователь (appuser)
- Health check встроен в образ

### Оптимизации production

1. **Кэширование слоёв**: `package*.json` копируются отдельно
2. **Минимальный размер**: Только production-зависимости
3. **Безопасность**: Non-root пользователь
4. **Health checks**: Встроены в Dockerfile и docker-compose

### Команды для prod

```bash
# Сборка production-образа
docker-compose --profile prod build

# Запуск production
docker-compose --profile prod up -d

# Просмотр статуса
docker-compose --profile prod ps

# Просмотр логов
docker-compose --profile prod logs -f app-prod

# Остановка
docker-compose --profile prod down

# Пересборка с нуля
docker-compose --profile prod build --no-cache
docker-compose --profile prod up -d
```

---

## Переменные окружения

### Обязательные переменные

| Переменная        | Описание               | Пример    |
| ----------------- | ---------------------- | --------- |
| `GEMINI_API_KEY`  | API ключ Google Gemini | `AIza...` |
| `MISTRAL_API_KEY` | API ключ Mistral AI    | `sk-...`  |

### Опциональные переменные

| Переменная                 | По умолчанию               | Описание                            |
| -------------------------- | -------------------------- | ----------------------------------- |
| `PORT`                     | `9230`                     | Порт backend сервера                |
| `NODE_ENV`                 | `development`/`production` | Режим работы                        |
| `LLM_PROVIDER`             | `auto`                     | Провайдер LLM (gemini/mistral/auto) |
| `LLM_TIMEOUT_SEC`          | `30`                       | Таймаут LLM запросов                |
| `LLM_MAX_TOKENS`           | `512`                      | Максимум токенов в ответе           |
| `PROXY_CONNECT_TIMEOUT_MS` | `30000`                    | Таймаут подключения прокси          |
| `PROXY_REQUEST_TIMEOUT_MS` | `60000`                    | Таймаут запроса прокси              |
| `NODE_OPTIONS`             | `--max-old-space-size=512` | Ограничение памяти Node.js          |

---

## Health Checks

### Endpoints

| Endpoint          | Описание                    | Ответ             |
| ----------------- | --------------------------- | ----------------- |
| `GET /api/health` | Health check для Docker     | `{"status":"ok"}` |
| `GET /health`     | Альтернативный health check | `{"status":"ok"}` |

### Конфигурация в docker-compose

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:9230/api/health']
  interval: 30s # Проверка каждые 30 секунд
  timeout: 10s # Таймаут ответа 10 секунд
  start_period: 15s # Ожидание перед первой проверкой
  retries: 3 # Количество попыток до unhealthy
```

### Проверка статуса

```bash
# Проверка health status контейнеров
docker-compose ps

# Ручная проверка endpoint
curl http://localhost:9230/api/health
# Ожидаемый ответ: {"status":"ok"}
```

---

## Мониторинг и логи

### Просмотр логов

```bash
# Все логи
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f app-prod

# Последние 100 строк
docker-compose logs --tail=100 app-prod
```

### Ресурсы контейнеров

```bash
# Статистика использования ресурсов
docker stats

# Информация о контейнере
docker inspect rutube-cinema-hub-app-prod-1
```

---

## Устранение неполадок

### Контейнер не стартует

```bash
# Проверить логи
docker-compose logs app-prod

# Проверить конфигурацию
docker-compose config

# Пересобрать с нуля
docker-compose --profile prod build --no-cache
```

### Health check fails

```bash
# Проверить доступность endpoint
curl -f http://localhost:9230/api/health

# Проверить логи контейнера
docker logs rutube-cinema-hub-app-prod-1

# Проверить статус health check
docker inspect --format='{{.State.Health.Status}}' rutube-cinema-hub-app-prod-1
```

### Проблемы с памятью

```bash
# Увеличить лимит памяти в docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       memory: 1G
```

### Очистка Docker

```bash
# Удалить все контейнеры и volumes проекта
docker-compose down -v

# Очистить неиспользуемые образы
docker image prune -f

# Полная очистка (осторожно!)
docker system prune -af --volumes
```

---

## CI/CD Integration

### Пример GitHub Actions

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker-compose --profile prod build

      - name: Test health check
        run: |
          docker-compose --profile prod up -d
          sleep 20
          curl -f http://localhost:9230/api/health
          docker-compose --profile prod down
```

---

## Чек-лист перед деплоем

- [ ] Создан `.env` файл с production-значениями
- [ ] API ключи валидны
- [ ] Порты 9229/9230 доступны
- [ ] Достаточно памяти (512MB+)
- [ ] Docker и Docker Compose обновлены
- [ ] Проверена сборка: `docker-compose --profile prod build`
- [ ] Проверен health check: `curl http://localhost:9230/api/health`
