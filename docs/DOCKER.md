# Docker Documentation

> Исчерпывающая документация по Docker-конфигурации проекта Rutube Cinema Hub

## Содержание

- [Обзор архитектуры](#обзор-архитектуры)
- [Профили Docker Compose](#профили-docker-compose)
- [Dockerfile (Multi-stage)](#dockerfile-multi-stage)
- [Переменные окружения](#переменные-окружения)
- [Скрипты управления](#скрипты-управления)
- [Команды Docker](#команды-docker)
- [Решение проблем](#решение-проблем)

---

## Обзор архитектуры

Проект использует **контейнеризированную архитектуру** с двумя режимами работы:

| Режим          | Профиль | Описание                                                   |
| -------------- | ------- | ---------------------------------------------------------- |
| **Разработка** | `dev`   | Два отдельных контейнера (frontend + backend) с hot-reload |
| **Продакшн**   | `prod`  | Единый контейнер с оптимизированной сборкой                |

### Порты

| Сервис         | Порт   | Назначение                    |
| -------------- | ------ | ----------------------------- |
| Frontend (dev) | `9229` | Vite dev server               |
| Backend (dev)  | `9230` | Express API сервер            |
| App (prod)     | `9230` | Единный сервер (static + API) |

---

## Профили Docker Compose

### Профиль разработки (`dev`)

Запускается по умолчанию. Разделяет frontend и backend на отдельные контейнеры.

#### frontend-dev

```yaml
frontend-dev:
  profiles: [dev]
  image: node:20-alpine
  working_dir: /app
  environment:
    VITE_PROXY_TARGET: http://backend-dev:9230
    HUSKY: '0'
    NODE_ENV: development
  volumes:
    - ./:/app
    - frontend_node_modules:/app/node_modules
  ports:
    - '9229:9229'
  command: >-
    sh -c "npm install && wait-on http://backend-dev:9230/api/health && npm run dev"
  depends_on:
    backend-dev:
      condition: service_healthy
```

**Особенности:**

- Монтирование исходного кода для hot-reload
- Отдельный volume для `node_modules` (избегает конфликтов с хостом)
- Ожидание готовности backend через healthcheck
- Проксирование API запросов на backend-dev

#### backend-dev

```yaml
backend-dev:
  profiles: [dev]
  image: node:20-alpine
  working_dir: /app
  environment:
    PORT: '9230'
    NODE_ENV: development
    NODE_OPTIONS: '--max-old-space-size=512'
    PROXY_CONNECT_TIMEOUT_MS: '30000'
    PROXY_REQUEST_TIMEOUT_MS: '60000'
    PROXY_RATE_LIMIT_MAX_REQUESTS: '1000'
    PROXY_RATE_LIMIT_WINDOW_MS: '60000'
  volumes:
    - ./:/app
    - backend_node_modules:/app/node_modules
  ports:
    - '9230:9230'
  command: >-
    sh -c "apk add ca-certificates curl && npm install && nodemon server/index.js"
  healthcheck:
    test: ['CMD', 'curl', '-f', 'http://localhost:9230/api/health']
    interval: 30s
    timeout: 10s
    start_period: 20s
    retries: 3
```

**Особенности:**

- Nodemon для автоматического перезапуска при изменениях
- Healthcheck на `/api/health`
- Расширенные таймауты для прокси

---

### Профиль продакшна (`prod`)

Единый оптимизированный контейнер.

#### app-prod

```yaml
app-prod:
  profiles: [prod]
  build:
    context: .
    dockerfile: Dockerfile
    target: production
    args:
      VITE_PROXY_TARGET: http://localhost:9230
  environment:
    NODE_ENV: production
    PORT: '9230'
    NODE_OPTIONS: '--max-old-space-size=512'
  ports:
    - '9230:9230'
  healthcheck:
    test: ['CMD', 'curl', '-f', 'http://localhost:9230/api/health']
    interval: 30s
    timeout: 10s
    start_period: 15s
    retries: 3
  restart: unless-stopped
```

**Особенности:**

- Multi-stage сборка (минимальный размер образа)
- Статические файлы раздаются Express
- Автоматический перезапуск при сбоях

---

## Dockerfile (Multi-stage)

Dockerfile использует **4 стадии** для оптимизации:

### Stage 1: Dependencies (`deps`)

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
```

**Назначение:** Кэшируемый слой с зависимостями. При изменении только кода (не package.json) этот слой не пересобирается.

### Stage 2: Builder (`builder`)

```dockerfile
FROM deps AS builder
WORKDIR /app
COPY . .
ARG VITE_PROXY_TARGET
ENV VITE_PROXY_TARGET=${VITE_PROXY_TARGET}
RUN npm run build
RUN npm prune --production
```

**Назначение:** Сборка frontend (Vite) и удаление devDependencies.

### Stage 3: Production (`production`)

```dockerfile
FROM node:20-alpine AS production

# Утилиты для HTTPS и healthcheck
RUN apk add --no-cache ca-certificates curl

# Непривилегированный пользователь
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Копирование только необходимых файлов
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Безопасность: непривилегированный пользователь
RUN chown -R appuser:appgroup /app
USER appuser

ENV NODE_ENV=production PORT=9230
EXPOSE 9230

HEALTHCHECK --interval=30s --timeout=10s \
    CMD curl -f http://localhost:9230/api/health || exit 1

CMD ["node", "server/index.js"]
```

**Назначение:** Минимальный production-образ с:

- Непривилегированным пользователем (security best practice)
- Только production зависимостями
- Собранным frontend и сервером

### Stage 4: Development (`development`)

```dockerfile
FROM node:20-alpine AS development
RUN apk add --no-cache ca-certificates curl
WORKDIR /app
ENV NODE_ENV=development HUSKY=0
CMD ["npm", "run", "dev"]
```

**Назначение:** Базовый образ для разработки (используется в docker-compose).

---

## Переменные окружения

### Обязательные переменные

Создайте `.env` файл на основе `.env.example`:

```bash
cp .env.example .env
```

### Переменные Docker

| Переменная          | По умолчанию                 | Описание                          |
| ------------------- | ---------------------------- | --------------------------------- |
| `NODE_ENV`          | `development` / `production` | Режим работы                      |
| `PORT`              | `9230`                       | Порт сервера                      |
| `VITE_PROXY_TARGET` | —                            | URL backend для Vite proxy        |
| `NODE_OPTIONS`      | `--max-old-space-size=512`   | Лимит памяти Node.js              |
| `HUSKY`             | `0`                          | Отключение git hooks в контейнере |

### Переменные прокси (backend)

| Переменная                      | По умолчанию | Описание                 |
| ------------------------------- | ------------ | ------------------------ |
| `PROXY_CONNECT_TIMEOUT_MS`      | `30000`      | Таймаут подключения (мс) |
| `PROXY_REQUEST_TIMEOUT_MS`      | `60000`      | Таймаут запроса (мс)     |
| `PROXY_RATE_LIMIT_MAX_REQUESTS` | `1000`       | Макс. запросов в окне    |
| `PROXY_RATE_LIMIT_WINDOW_MS`    | `60000`      | Окно rate limit (мс)     |

---

## Скрипты управления

### npm скрипты

```json
{
  "scripts": {
    "docker:rebuild": "bash scripts/docker-rebuild-quick.sh",
    "docker:rebuild:full": "bash scripts/docker-rebuild-full.sh",
    "docker:clean": "docker-compose down -v && docker builder prune -f",
    "docker:logs": "docker-compose logs -f",
    "docker:ps": "docker-compose ps"
  }
}
```

### docker-rebuild-quick.sh

**Быстрая пересборка** для повседневной разработки.

```bash
./scripts/docker-rebuild-quick.sh
# или
npm run docker:rebuild
```

**Что делает:**

1. Останавливает контейнеры (`docker-compose down -v`)
2. Удаляет образы проекта
3. Очищает кэш сборки
4. Собирает с `--no-cache`
5. Запускает контейнеры

**Когда использовать:**

- Изменения не применяются в контейнере
- Обычная пересборка при разработке

### docker-rebuild-full.sh

**Полная очистка и пересборка** с нуля.

```bash
./scripts/docker-rebuild-full.sh
# или
npm run docker:rebuild:full
```

**Что делает:**

1. Останавливает все контейнеры
2. Удаляет контейнеры, сети и тома проекта
3. Удаляет Docker образы проекта
4. Очищает кэш Docker build
5. (Опционально) Глубокая очистка всей Docker системы
6. Проверяет наличие `.env` файла
7. Собирает образы с `--no-cache`
8. Запускает контейнеры

**Опции:**

```bash
# Только очистка, без сборки
./scripts/docker-rebuild-full.sh --skip-build
```

**Когда использовать:**

- Первое развертывание проекта
- Критические проблемы с Docker образами
- После крупных изменений в Dockerfile
- Для освобождения места на диске

---

## Команды Docker

### Запуск

```bash
# Разработка (по умолчанию)
docker-compose up

# Продакшн
docker-compose --profile prod up

# Фоновый режим
docker-compose up -d

# С пересборкой
docker-compose up --build
```

### Управление

```bash
# Статус контейнеров
docker-compose ps
npm run docker:ps

# Логи (все сервисы)
docker-compose logs -f
npm run docker:logs

# Логи конкретного сервиса
docker-compose logs -f backend-dev
docker-compose logs -f frontend-dev

# Перезапуск
docker-compose restart

# Остановка
docker-compose down

# Остановка с удалением томов
docker-compose down -v
npm run docker:clean
```

### Отладка

```bash
# Вход в контейнер
docker-compose exec backend-dev sh
docker-compose exec frontend-dev sh

# Выполнение команды в контейнере
docker-compose exec backend-dev npm run test

# Просмотр использования места
docker system df

# Информация о контейнере
docker-compose exec backend-dev env
```

### Сборка

```bash
# Сборка без кэша
docker-compose build --no-cache

# Сборка конкретного сервиса
docker-compose build --no-cache backend-dev

# Сборка prod образа
docker-compose --profile prod build
```

---

## .dockerignore

Файл `.dockerignore` исключает ненужные файлы из Docker context:

```dockerignore
# Dependencies
node_modules
npm-debug.log

# Build output
dist
build

# Development files
.git
.gitignore
.husky
.idea
.vscode
*.md
!README.md

# Test files
tests
coverage
*.test.js
*.test.ts
playwright.config.ts
vitest.config.ts

# Environment files
.env
.env.local
.env.*.local

# Logs
logs
*.log

# Docker files (prevent recursive context)
docker-compose*.yml
.docker

# Scripts
scripts/*.sh
scripts/*.js
scripts/README*.md
!scripts/*.json
```

**Зачем это нужно:**

- Уменьшает размер Docker context
- Ускоряет сборку
- Исключает чувствительные файлы

---

## Решение проблем

### Контейнер не запускается

```bash
# Проверить логи
docker-compose logs backend-dev

# Пересобрать без кэша
npm run docker:rebuild

# Проверить healthcheck
docker-compose exec backend-dev curl -f http://localhost:9230/api/health
```

### Изменения в коде не применяются

```bash
# Остановить и удалить тома
npm run docker:clean

# Пересобрать
npm run docker:rebuild
```

### Закончилось место на диске

```bash
# Проверить использование
docker system df

# Полная очистка Docker
docker system prune -a --volumes

# Или через скрипт
./scripts/docker-rebuild-full.sh
# (выбрать "y" для глубокой очистки)
```

### Проблемы с сетью

```bash
# Удалить сети и пересоздать
docker-compose down --remove-orphans
docker network prune
docker-compose up -d
```

### Проблемы с DNS в контейнере

В docker-compose настроены DNS серверы Google и Cloudflare:

```yaml
dns:
  - 8.8.8.8
  - 1.1.1.1
```

При проблемах с сетью проверьте:

```bash
docker-compose exec backend-dev ping google.com
docker-compose exec backend-dev nslookup rutube.ru
```

### Ошибки с правами доступа

Если возникают проблемы с правами на файлы:

```bash
# Проверить пользователя в контейнере
docker-compose exec backend-dev id

# Исправить права на файлы (с хоста)
sudo chown -R $(whoami):$(whoami) .
```

### Проблемы с node_modules

При конфликтах node_modules между хостом и контейнером:

```bash
# Полная пересборка с удалением томов
npm run docker:rebuild:full
```

---

## Best Practices

1. **Всегда используйте `.env` файл** — не хардкодьте секреты в Dockerfile
2. **Регулярно очищайте Docker** — `docker system prune` освобождает место
3. **Используйте `--no-cache` при проблемах** — гарантирует свежие зависимости
4. **Не запускайте от root** — production образ использует непривилегированного пользователя
5. **Мониторьте логи** — `docker-compose logs -f` помогает отладке

---

## Структура Docker-файлов

```
rutube-cinema-hub/
├── docker-compose.yml       # Основная конфигурация
├── Dockerfile               # Multi-stage сборка
├── .dockerignore           # Исключения из контекста
└── scripts/
    ├── docker-rebuild-full.sh   # Полная пересборка
    ├── docker-rebuild-quick.sh  # Быстрая пересборка
    └── README-docker.md         # Документация скриптов
```
