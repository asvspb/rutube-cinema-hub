# Kino Club

> **Статус проекта:** ✅ Production Ready  
> **Версия:** 1.0.0  
> **Последнее обновление:** 2026-02-18

Современный веб-интерфейс для просмотра видео из Rutube с интеллектуальной системой рейтингов на основе LLM и продвинутыми возможностями управления контентом.

## ✨ Особенности

- 🎬 **KinoRate AI** — умная система рейтингов на основе LLM (Gemini + Mistral)
- 🔄 **Мульти-стратегия парсинга** — 4 способа получения данных из Rutube
- 🎨 **Современный UI** — React 18 + TailwindCSS + Framer Motion
- ♿ **WCAG AA compliant** — 17/18 критериев доступности
- 📱 **PWA ready** — работает offline, устанавливается как приложение
- 🐳 **Docker support** — готовые контейнеры для dev и production
- ✅ **Хорошо протестировано** — 522 автотеста + CI/CD pipeline
- 🚀 **Производительность** — IndexedDB кэширование, React.memo, debounce

## 📊 Метрики проекта

| Метрика               | Значение                                |
| --------------------- | --------------------------------------- |
| Строк кода TypeScript | ~5000+                                  |
| App.tsx               | 17 строк (декомпозирован)               |
| Хуков React           | 22 специализированных                   |
| Тестов                | 522 (100% pass)                         |
| Покрытие кода         | 49.23% lines, 57.87% functions          |
| CI/CD jobs            | 5 (lint, typecheck, test, build, smoke) |
| Docker образ          | 330MB (Alpine + multi-stage)            |
| Bundle size           | ~303KB gzipped                          |

## 📋 Установка, настройка и запуск приложения

### Требования

- Node.js (версия 18 или выше)
- npm или yarn
- curl (для тестирования)

### Установка

1. Клонируйте репозиторий:

   ```bash
   git clone https://github.com/your-username/rutube-cinema-hub.git
   cd rutube-cinema-hub
   ```

2. Установите зависимости:
   ```bash
   npm install
   ```

### Настройка

1. Создайте файл `.env` в корне проекта на основе шаблона `.env.example`:

   ```bash
   cp .env.example .env
   ```

2. Отредактируйте файл `.env`, добавив свои API-ключи:

   ```env
   # API ключи для KinoRate AI
   GEMINI_API_KEY=ваш_ключ_gemini
   MISTRAL_API_KEY=ваш_ключ_mistral

   # Модели для LLM (опционально)
   GEMINI_MODEL_NAME=gemini-2.5-flash
   MISTRAL_MODEL_NAME=mistral-medium-2505

   # Выбор провайдера LLM (gemini, mistral, auto)
   LLM_PROVIDER=auto

   # Порт для backend сервера (по умолчанию 9230)
   PORT=9230
   ```

3. Убедитесь, что у вас есть API-ключи для:
   - Google Gemini (для получения данных о фильмах)
   - Mistral AI (альтернативный провайдер, опционально)

### Запуск

#### Вариант 0: Docker Compose (frontend + backend)

Запускает два сервиса с авто‑перезагрузкой и пробросом портов:

```bash
docker compose up
```

После запуска:

- Frontend: http://localhost:9229
- Backend: http://localhost:9230
- Прокси-эндпоинт: http://localhost:9230/api/proxy

Опционально после старта можно запустить smoke‑тест:

```bash
npm run test
```

#### Вариант 1: Запуск в режиме разработки (рекомендуется)

Для одновременного запуска frontend (Vite) и backend серверов:

```bash
npm run dev:all
```

После запуска:

- Frontend будет доступен по адресу: http://localhost:9229
- Backend будет работать на порту: http://localhost:9230
- Прокси-эндпоинт: http://localhost:9230/api/proxy

#### Вариант 2: Запуск по отдельности

1. Запустите backend сервер:

   ```bash
   npm run server
   ```

2. В новом терминале запустите frontend (Vite):
   ```bash
   npm run dev
   ```

#### Вариант 3: Запуск в продакшен-режиме

1. Соберите проект:

   ```bash
   npm run build
   ```

2. Запустите продакшен-сервер:
   ```bash
   npm run server
   ```

Приложение будет доступно по адресу: http://localhost:9230

### Тестирование

Для проверки работоспособности приложения запустите smoke-тест:

```bash
npm run test
```

Или запустите тесты API отдельно:

```bash
npm run test:api
```

### Скрипты

#### Разработка

- `npm run dev` - запуск frontend сервера (Vite) на порту 9229
- `npm run server` - запуск backend сервера на порту 9230
- `npm run dev:all` - запуск frontend и backend серверов одновременно
- `npm run build` - сборка проекта для продакшена
- `npm run preview` - предпросмотр продакшен-сборки

#### Тестирование

- `npm run test` - запуск всех тестов (frontend + backend)
- `npm run test:api` - запуск backend тестов
- `npm run test:frontend` - запуск frontend тестов (Vitest)
- `npm run test:frontend:watch` - запуск frontend тестов в watch-режиме
- `npm run test:frontend:coverage` - запуск тестов с отчётом покрытия
- `npm run test:proxy` - тестирование прокси

#### Docker

- `npm run docker:rebuild` - быстрая пересборка Docker-образа
- `npm run docker:rebuild:full` - полная пересборка Docker-образа
- `npm run docker:clean` - очистка Docker-контейнеров и томов
- `npm run docker:logs` - просмотр логов Docker
- `npm run docker:ps` - статус Docker-контейнеров

#### Качество кода

- `npm run lint` - проверка ESLint
- `npm run lint:fix` - автоисправление ESLint ошибок
- `npm run format` - форматирование кода Prettier
- `npm run format:check` - проверка форматирования

## 🎬 Демонстрация функционала

_(Здесь будет добавлено GIF-демонстрация основного функционала приложения)_

## ❓ Часто задаваемые вопросы (FAQ)

### 1. Почему нужен API-ключ для работы приложения?

Приложение использует AI для получения расширенной информации о фильмах и сериалах (рейтинги, описание, награды). Для этого используются API-ключи от Google Gemini и/или Mistral AI. Эти ключи необходимы для работы функции KinoRate AI.

### 2. Как добавить каналы для отслеживания?

1. Нажмите кнопку "Добавить канал" в интерфейсе приложения
2. Введите URL канала Rutube (например, `https://rutube.ru/channel/...`)
3. Приложение автоматически начнет загрузку видео с этого канала

### 3. Что делать, если видео не загружаются?

Возможные причины:

- Проблемы с доступом к Rutube (географические ограничения)
- Временные проблемы с API Rutube
- Проблемы с прокси-серверами

Попробуйте:

- Проверить подключение к интернету
- Перезагрузить страницу
- Проверить настройки прокси в конфигурации сервера

### 4. Как работает система рейтингов KinoRate AI?

Система KinoRate AI использует два подхода:

1. **Локальная база** - проверка встроенной базы из топ-250/1000 фильмов
2. **AI-запрос** - обращение к LLM для получения информации о фильмах вне топ-списков

### 5. Какие данные сохраняются в браузере?

Приложение использует localStorage для сохранения:

- Добавленных каналов и плейлистов
- Настроек интерфейса
- Истории просмотров
- Статусов видео (лайк, просмотрено, отложенное)
- Кэша метаданных фильмов

## 🤝 Как внести вклад в развитие проекта

### Технические требования

- Знание TypeScript/React
- Понимание работы с API и асинхронными операциями
- Опыт работы с AI/LLM-провайдерами (желательно)

### Процесс участия

1. **Форкните репозиторий**
2. **Создайте ветку** для вашей функции (`git checkout -b feature/AmazingFeature`)
3. **Внесите изменения** в код
4. **Протестируйте** изменения
5. **Зафиксируйте изменения** (`git commit -m 'Add some AmazingFeature'`)
6. **Запушьте ветку** (`git push origin feature/AmazingFeature`)
7. **Создайте Pull Request**

### Рекомендации по коду

- Следуйте принципам чистого кода
- Пишите понятные комментарии к сложной логике
- Обновляйте документацию при необходимости
- Пишите тесты для новых функций

### Типы вклада

- Исправление багов
- Добавление новых функций
- Улучшение документации
- Оптимизация производительности
- Улучшение пользовательского интерфейса

## 🤖 Инструкции для AI-агентов и Разработчиков

Этот документ содержит критически важную информацию об архитектуре приложения, особенно касающуюся обхода блокировок и CORS.

### 1. Архитектура Проксирования (Self-hosted Reverse Proxy)

Для обеспечения работы приложения из РФ без VPN и обхода CORS, в `services/rutubeService.ts` заложена логика гибридного проксирования.

**Логика работы фронтенда:**

1.  **Приоритет 1 (Локальный прокси):** Приложение сначала пытается отправить запрос на `/api/proxy?url=...`. Это ожидаемый эндпоинт собственного бэкенда.
2.  **Приоритет 2 (Публичные прокси):** Если локальный прокси возвращает ошибку (404/Connection Refused), приложение автоматически переключается на публичные сервисы (`corsproxy.io`, `allorigins.win`).

### 2. Требования к реализации Бэкенда

При реализации серверной части (Node.js/Express/Nginx) необходимо соблюдать следующие спецификации, чтобы фронтенд подхватил их автоматически:

- **Endpoint:** `GET /api/proxy`
- **Query Param:** `url` (целевой URL Rutube API)
- **Обязательные заголовки запроса к Rutube:**
  ```javascript
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/html, */*',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://rutube.ru/',
    'Origin': 'https://rutube.ru'
  }
  ```
- **CORS:** Сервер должен отдавать заголовки `Access-Control-Allow-Origin`, разрешающие запросы с домена фронтенда (или `*` в режиме разработки).
- **Безопасность:** Валидировать параметр `url`, разрешая запросы только к `*.rutube.ru`.

### 3. Стек технологий

#### Frontend

- **React 18.3.1** — UI framework
- **TypeScript (strict mode)** — типобезопасность
- **TailwindCSS** — utility-first CSS
- **Framer Motion** — анимации
- **Lucide React** — иконки
- **Recharts** — графики рейтингов
- **Vite 6.2** — сборщик

#### Backend

- **Node.js 18+** — runtime
- **Express 5** — веб-фреймворк
- **Helmet.js** — security headers
- **express-rate-limit** — rate limiting
- **Zod** — runtime валидация

#### AI/LLM

- **Google Gemini API** — primary LLM
- **Mistral AI** — fallback LLM
- **Dual-provider** с автоматическим fallback

#### Storage

- **IndexedDB** — клиентское хранилище (50MB+)
- **localStorage** — настройки (fallback)

#### DevOps

- **Docker** — контейнеризация (multi-stage build)
- **Docker Compose** — оркестрация
- **GitHub Actions** — CI/CD (5 jobs)
- **Vitest** — unit testing
- **Playwright** — E2E testing (config готов)
- **ESLint + Prettier** — code quality

### 4. Основные файлы и их назначение

- **`services/rutubeService.ts`**:
  - `getProxies()`: Список стратегий проксирования.
  - `fetchTextWithRace()`: Логика параллельного опроса прокси.
  - `fetchVideos()`: Основная логика получения контента (API -> Scraping -> Redux State extraction).
  - `resolveRutubeId()`: Разрешение ссылок вида `/channel/ID` и `/u/SLUG`.
- **`components/CategoryFilter.tsx`**: Компонент фильтрации с поддержкой Drag-n-Drop (Reorder) и контекстного меню.
- **`App.tsx`**: Основная логика состояния, кэширование видео (`videoCache`), роутинг каналов.

### 5. Особенности получения данных Rutube

Rutube API фрагментирован. Если стандартный JSON API не возвращает данные, сервис использует фоллбэки:

1.  **Redux State Scraping:** Парсинг HTML страницы канала и извлечение `window.reduxState`.
2.  **Direct Regex:** Поиск JSON-подобных структур в теле страницы.
3.  **Metainfo API:** Использование эндпоинтов для TV-приложений (они часто стабильнее веб-версии).

## 🔒 Безопасность

Проект реализует многоуровневую защиту:

| Компонент           | Реализация                                |
| ------------------- | ----------------------------------------- |
| Rate limiting       | 100 req/15min (proxy), 50 req/15min (AI)  |
| Domain allowlist    | rutube.ru, \*.rutube.ru                   |
| Private IP blocking | IPv4 + IPv6                               |
| CORS whitelist      | localhost origins                         |
| Security headers    | Helmet.js                                 |
| Circuit Breaker     | Proxy endpoints (30s timeout, 5 failures) |
| Zod validation      | 8 схем валидации данных                   |

## 📚 Документация

### Основная документация

| Документ                                                  | Описание                       |
| --------------------------------------------------------- | ------------------------------ |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md)                 | Архитектура проекта            |
| [STATE_MANAGEMENT.md](./docs/STATE_MANAGEMENT.md)         | Управление состоянием          |
| [TYPE_SYSTEM.md](./docs/TYPE_SYSTEM.md)                   | Система типов и валидация      |
| [PERFORMANCE.md](./docs/PERFORMANCE.md)                   | Оптимизации производительности |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md)                     | Руководство по деплою          |
| [ACCESSIBILITY_REPORT.md](./docs/ACCESSIBILITY_REPORT.md) | Отчёт по доступности           |
| [PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)             | Статус проекта                 |
| [CONTRIBUTING.md](./CONTRIBUTING.md)                      | Как внести вклад               |

### Архитектурные решения (ADR)

- [ADR-001: Multi-strategy data fetching](./docs/adr/001-use-multi-strategy-data-fetching-from-rutube.md) — 4 стратегии парсинга
- [ADR-002: Dual LLM provider](./docs/adr/002-use-dual-llm-provider-with-auto-fallback.md) — Gemini + Mistral fallback
