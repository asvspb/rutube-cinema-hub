# Kino Club - Roadmap

## ✅ Завершённые этапы (Этапы -1 через 5)

### ✅ Этап -1: Мгновенные исправления

- Удалены пустые директории
- Создан .nvmrc (Node 18)
- Добавлен GET /health
- Env validation с предупреждениями
- Убран `(this as any)` из index.tsx

### ✅ Этап 0: Инфраструктура качества

- ESLint + Prettier + husky + lint-staged
- Compression middleware
- GitHub Actions CI базовый
- rollup-plugin-visualizer для анализа бандла

### ✅ Этап 1: Декомпозиция App.tsx

- App.tsx сокращён до 17 строк (было ~1500+)
- 21 специализированный хук
- Модульная серверная архитектура (52 строки server/index.js)
- Полная замена isMounted на AbortController

### ✅ Этап 2: Рефакторинг сервера

- Модульная структура: routes/, middleware/, services/, config/
- Circuit Breaker для прокси
- Исправлена рекурсия в loggerService
- Все middleware разделены и тестируемы

### ✅ Этап 3: Типизация и валидация

- 0 использований `any` в сервисах (было 15+)
- 5 модулей типов (540 строк): rutube, kinorate, ui, schemas, index
- 8 Zod-схем + 6 функций валидации
- Strict TypeScript mode без ошибок
- Все 365 тестов проходят

### ✅ Этап 4: Производительность и UX

- React.memo для VideoCard с кастомным arePropsEqual
- Debounce на поиск (300ms) через useDebouncedValue
- IndexedDB сервис (352 строки) с TTL и автоочисткой
- LLM кэш в IndexedDB (TTL 7 дней)
- Миграция видео-кэша на IndexedDB (лимит 50MB+)
- Оптимизация изображений (lazy loading, async decoding)

### ✅ Этап 5: Тестирование и CI/CD

- 522 теста (401 frontend + 121 backend), 100% прохождение
- 5 новых тестовых файлов (1083 строки кода)
- CI/CD pipeline: lint → typecheck → test-frontend → test-backend → build → smoke
- Покрытие: 49.23% lines, 57.87% functions
- Playwright config готов (требует установки)
- Документация: docs/TESTING_REPORT_STAGE5.md

---

### ✅ Этап 6: Docker и деплой

- Multi-stage Dockerfile (deps → builder → production → development)
- Docker Compose profiles (dev / prod)
- Health checks на всех уровнях
- Production образ: 330MB (Alpine + non-root user)
- Документация: docs/DEPLOYMENT.md (338 строк)

### ✅ Этап 7: UX и доступность

- Focus trap хук интегрирован в 7 модальных окон
- 79 ARIA-атрибутов добавлено
- Skip-to-content ссылка
- Цветовой контраст WCAG AA (5/6 цветов проходят 4.5:1+)
- PWA: manifest.json + service worker (143 строки)
- Документация: docs/ACCESSIBILITY_REPORT.md

---

## 🎉 Текущий статус: ВСЕ ЭТАПЫ ЗАВЕРШЕНЫ!

**Последнее обновление:** 2026-02-23

**Усиленный план развития выполнен на 100%:**

- ✅ Этап -1: Мгновенные исправления
- ✅ Этап 0: Инфраструктура качества
- ✅ Этап 1: Декомпозиция App.tsx
- ✅ Этап 2: Рефакторинг сервера
- ✅ Этап 3: Типизация и валидация
- ✅ Этап 4: Производительность и UX
- ✅ Этап 5: Тестирование и CI/CD
- ✅ Этап 6: Docker и деплой
- ✅ Этап 7: UX и доступность

---

## 📋 Рекомендации для дальнейшего развития

> **Источник**: [CODE_REVIEW.md](docs/CODE_REVIEW.md) - детальный анализ от 2026-02-23
>
> Все 9 этапов базового плана развития (Этапы -1 → 7) завершены на 100%.  
> Ниже представлен **расширенный план** (Этапы 8-12) на основе выявленных возможностей для роста.

---

## 🚀 Этап 8: Аутентификация и авторизация (P0 — Критический)

**Оценка**: 3-5 дней | **Статус**: ❌ Не начат | **Приоритет**: 🔴 Критический

### Контекст

Prisma ORM интегрирован, схема User + Session определена, детальная документация готова (AUTH_IMPLEMENTATION_PLAN.md — 594 строки, DB_SCHEMA_AUTH.md — 937 строк). Однако backend routes, middleware авторизации и frontend формы отсутствуют.

### Задачи

#### 8.1 Backend Routes (server/routes/auth.js)

- [ ] **POST /api/auth/register** — регистрация нового пользователя
  - Валидация email/username через Zod
  - Хеширование пароля (bcrypt/argon2)
  - Создание User записи через Prisma
  - Rate limiting (5 попыток/15 мин на IP)
  - Возврат access + refresh токенов

- [ ] **POST /api/auth/login** — вход в систему
  - Проверка credentials
  - Создание Session записи
  - Генерация JWT dual-token (access 15min + refresh 7d)
  - Refresh token в HTTP-only cookie
  - Rate limiting (10 попыток/15 мин на IP)

- [ ] **POST /api/auth/logout** — выход из системы
  - Инвалидация refresh token
  - Удаление Session из БД
  - Очистка HTTP-only cookie

- [ ] **POST /api/auth/refresh** — обновление токенов
  - Проверка refresh token из cookie
  - Refresh token rotation (выдача нового, инвалидация старого)
  - Обнаружение повторного использования токена (security breach detection)

- [ ] **GET /api/auth/me** — получение данных текущего пользователя
  - Проверка access token через middleware
  - Возврат профиля пользователя

#### 8.2 Middleware (server/middleware/auth.js)

- [ ] **verifyToken(req, res, next)** — проверка JWT access token
  - Извлечение из Authorization header
  - Верификация подписи и срока действия
  - Декодирование payload и добавление в req.user

- [ ] **requireAuth** — middleware для защищённых маршрутов
  - Обязательная авторизация (401 если токен отсутствует/невалиден)

- [ ] **optionalAuth** — middleware для опциональной авторизации
  - Декодирование токена если присутствует, но не требующее обязательности

#### 8.3 Services (server/services/auth.js)

- [ ] **hashPassword(password)** — bcrypt/argon2 хеширование
- [ ] **verifyPassword(password, hash)** — проверка пароля
- [ ] **generateTokens(userId)** — создание access + refresh JWT
- [ ] **verifyRefreshToken(token)** — проверка refresh токена

#### 8.4 Prisma Миграции

- [ ] Запустить миграции для User + Session моделей
- [ ] Индексы на userId, sessionToken, expiresAt
- [ ] Seed скрипт для тестовых пользователей (dev окружение)

#### 8.5 Frontend Implementation

- [ ] **src/contexts/AuthContext.tsx** — React Context для авторизации
  - Состояние: user, isAuthenticated, isLoading
  - Методы: login, logout, register, refreshToken

- [ ] **src/hooks/useAuth.ts** — хук для работы с AuthContext
  - Автоматический refresh токена при истечении
  - Перенаправление на login при 401

- [ ] **src/components/AuthModal.tsx** — модальное окно авторизации
  - Вкладки: Login / Register
  - Валидация формы через Zod
  - UX: показ ошибок, loading states

- [ ] **src/components/UserMenu.tsx** — меню пользователя в Navigation
  - Профиль, настройки, выход

#### 8.6 Серверная синхронизация данных

- [ ] Миграция localStorage данных в Prisma:
  - **Плейлисты** (таблица UserPlaylist)
  - **История просмотров** (таблица WatchHistory)
  - **Настройки** (таблица UserSettings)

- [ ] API endpoints для синхронизации:
  - `GET /api/user/playlists` — получение плейлистов
  - `POST /api/user/playlists` — сохранение плейлиста
  - `GET /api/user/history` — получение истории
  - `POST /api/user/history` — добавление в историю

#### 8.7 Security Enhancements

- [ ] CSRF защита для auth endpoints
- [ ] Rate limiting на login/register (brute-force protection)
- [ ] Email verification (опционально для MVP)
- [ ] Password reset flow (опционально для MVP)
- [ ] Session timeout и автоматический logout

#### 8.8 Testing

- [ ] **Unit тесты** для auth service функций
- [ ] **Integration тесты** для auth routes (register, login, logout, refresh)
- [ ] **E2E тесты** для полного auth flow (Playwright)
- [ ] Тесты на security: brute-force, CSRF, token reuse detection

**Результат**: Полноценная система аутентификации с JWT, серверными сессиями, синхронизацией данных пользователей.

---

## 🔧 Этап 9: Устранение технического долга (P0 — Критический)

**Оценка**: 2-3 дня | **Статус**: ❌ Не начат | **Приоритет**: 🔴 Критический

### 9.1 Устранить 29 оставшихся `any` типов (TD-17)

**Контекст**: После Этапа 3 все `any` в сервисах устранены, но в других модулях осталось 29 использований.

#### Файлы и решения:

- [ ] **src/services/storageService.ts** (7 шт.)

  ```typescript
  // Было: playlists: any[]
  // Стало: playlists: CategoryDef[]

  // Было: watchHistory: any[]
  // Стало: watchHistory: WatchHistoryItem[]

  // Было: getAvailablePlaylistsForChannel(): any[]
  // Стало: getAvailablePlaylistsForChannel(): CategoryDef[]
  ```

- [ ] **src/services/loggerService.ts** (4 шт.)

  ```typescript
  // Было: context?: any
  // Стало: context?: Record<string, unknown>
  ```

- [ ] **src/hooks/** (7 шт. в useChannelMenu, useMainContentProps, useAppLogic, useCategoryEffects)
  - Типизировать параметры функций
  - Типизировать возвращаемые значения

- [ ] **src/components/** (4 шт. в UIComponents, AddCategoryModal, AddChannelModal, KinoRateModal)
  - Типизировать props интерфейсы
  - Типизировать event handlers

- [ ] **src/services/top250Data.ts** (3 шт. в toAwardObjects, normalizeDataset)

  ```typescript
  // Было: toAwardObjects(data: any): Award[]
  // Стало: toAwardObjects(data: RawAwardData): Award[]
  ```

- [ ] **Остальные** (4 шт. разрозненно)
  - Провести аудит через `grep -rn "any" src/` (исключая комментарии)
  - Заменить на конкретные типы

**Метрика**: 29 → 0 использований `any`

### 9.2 Разделить useAppComposition.ts (TD-20)

**Контекст**: Файл содержит 545 строк и объединяет логику всех доменов приложения.

- [ ] Создать **src/hooks/compositions/useChannelComposition.ts**
  - Логика: каналы, категории, фильтры
  - Хуки: useChannels, useCategoryEffects, useFilters

- [ ] Создать **src/hooks/compositions/useVideoComposition.ts**
  - Логика: видео, статусы, модалки
  - Хуки: useVideoLogic, useVideoStatuses, useVideoCache

- [ ] Создать **src/hooks/compositions/useUIComposition.ts**
  - Логика: UI состояние, поиск, пагинация, сортировка
  - Хуки: useUIState, useSearch, usePagination, useSortingAndGrid

- [ ] Обновить **src/hooks/useAppComposition.ts**
  - Использовать доменные композиции
  - Уменьшить до ~200 строк (только оркестрация)

**Метрика**: 545 строк → 200 строк (оркестрация) + 3 доменных хука

### 9.3 Упростить useMainContentProps.ts (TD-21)

**Контекст**: Файл содержит 507 строк, смешивает маппинг props с бизнес-логикой.

- [ ] Вынести бизнес-логику в отдельные хуки
- [ ] Оставить только маппинг props для MainContent
- [ ] Целевой размер: ~250 строк

### 9.4 Синхронизировать Node версии (TD-22)

- [ ] Вариант A: Обновить `.nvmrc` до Node 20
- [ ] Вариант B: Обновить Dockerfile до Node 18
- [ ] Рекомендация: **Вариант A** (Node 20 LTS с улучшенной производительностью)

### 9.5 Установить Playwright и запустить E2E (TD-19)

- [ ] `npm install -D @playwright/test`
- [ ] `npx playwright install` (установка браузеров)
- [ ] Запустить существующий тест: `npx playwright test tests/e2e/homepage.spec.ts`
- [ ] Добавить в CI/CD pipeline (GitHub Actions)
- [ ] Написать дополнительные E2E сценарии:
  - Навигация по каналам
  - Поиск видео
  - Открытие VideoModal
  - KinoRate workflow

**Результат**: 0 `any` типов, улучшенная архитектура хуков, запущенные E2E тесты.

---

## 🎨 Этап 10: MetaInfo TV + Playlist Auto-Import (P1 — Важный)

**Оценка**: 3-5 дней | **Статус**: ❌ Не начат | **Приоритет**: 🟡 Важный

### 10.1 MetaInfo TV интеграция

**План**: `docs/devai/METAINFO_TV_IMPLEMENTATION_PLAN.md` (415 строк)

- [ ] Реализовать парсер MetaInfo.tv API/HTML
- [ ] Добавить UI для просмотра расширенных метаданных фильма
- [ ] Интеграция с KinoRate (дополнительный источник данных)
- [ ] Кэширование в IndexedDB (TTL 30 дней)
- [ ] Обработка ошибок и fallback на локальную базу

### 10.2 Playlist Auto-Import

**План**: `docs/devai/PLAYLIST_AUTO_IMPORT_PLAN.md` (712 строк)

- [ ] Реализовать автоматический импорт плейлистов из Rutube
- [ ] UI для выбора каналов для импорта
- [ ] Background sync через Service Worker
- [ ] Уведомления о новых видео в плейлистах
- [ ] Настройки частоты обновления (ежедневно/еженедельно)

### 10.3 Testing

- [ ] Unit тесты для парсеров
- [ ] Integration тесты для API endpoints
- [ ] E2E тесты для пользовательских сценариев

### 10.4 Документация

- [ ] Обновить ARCHITECTURE.md с новыми модулями
- [ ] User guide для новых фич
- [ ] API документация

**Результат**: Расширенные метаданные фильмов, автоматический импорт плейлистов.

---

## 🧪 Этап 11: Тестирование и качество (P1 — Важный)

**Оценка**: 2-3 дня | **Статус**: ❌ Не начат | **Приоритет**: 🟡 Важный

### 11.1 Увеличить покрытие тестами до 70%+ (TD-21)

**Текущее**: 49.23% lines, 57.87% functions  
**Цель**: 70% lines, 80% functions

#### Приоритетные файлы для покрытия:

- [ ] **src/components/MainContent.tsx**
  - Рендеринг разных состояний (loading, empty, error)
  - Взаимодействие с VideoCard
  - Пагинация и фильтры

- [ ] **src/components/Navigation.tsx**
  - Переключение категорий
  - Активное состояние меню
  - Drag-and-drop каналов

- [ ] **src/components/CategoryFilter.tsx**
  - Фильтрация по категориям
  - Множественный выбор
  - Сброс фильтров

- [ ] **src/hooks/useAppComposition.ts**
  - Интеграционные тесты композиции хуков
  - Проверка корректности объединения состояний

- [ ] **src/components/KinoRate/KinoRateModal.tsx**
  - Batch режим
  - Формула рейтинга
  - Визуализация графиков

### 11.2 Playwright E2E для критических сценариев

- [ ] **Auth Flow**
  - Регистрация → Вход → Выход
  - Обновление токена при истечении

- [ ] **Video Discovery**
  - Навигация по каналам → Выбор видео → Просмотр в модалке

- [ ] **Search & Filter**
  - Поиск видео → Фильтрация по категориям → Сортировка

- [ ] **KinoRate Workflow**
  - Открытие модалки → Анализ фильма → Просмотр рейтинга

- [ ] **Playlist Management**
  - Создание плейлиста → Добавление видео → Удаление

### 11.3 Автоматический a11y аудит (TD-24)

- [ ] Установить `axe-core` и `@axe-core/playwright`
- [ ] Добавить a11y тесты в Playwright:

  ```typescript
  import { injectAxe, checkA11y } from '@axe-core/playwright';

  test('homepage should be accessible', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    await checkA11y(page);
  });
  ```

- [ ] Интеграция в CI/CD pipeline
- [ ] Автоматический отчёт по WCAG нарушениям

### 11.4 Conventional Commits

- [ ] Установить `@commitlint/cli` и `@commitlint/config-conventional`
- [ ] Настроить husky hook для commit-msg
- [ ] Конфигурация в `.commitlintrc.json`:
  ```json
  {
    "extends": ["@commitlint/config-conventional"],
    "rules": {
      "type-enum": [2, "always", ["feat", "fix", "docs", "style", "refactor", "test", "chore"]]
    }
  }
  ```

### 11.5 Visual Regression тесты

- [ ] Playwright screenshot тесты для ключевых UI:

  ```typescript
  test('VideoCard matches snapshot', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.video-card').first()).toHaveScreenshot();
  });
  ```

- [ ] Baseline screenshots в репозитории
- [ ] Автоматическое сравнение в CI

**Результат**: Покрытие 70%+, E2E тесты, автоматический a11y аудит, visual regression.

---

## ⚡ Этап 12: Продвинутые фичи и масштабирование (P2 — Улучшение)

**Оценка**: 5-7 дней | **Статус**: ❌ Не начат | **Приоритет**: 🟢 Улучшение

### 12.1 Виртуализация списков (TD-25)

**Контекст**: При большом количестве видео все карточки рендерятся в DOM, что снижает производительность.

- [ ] Установить `@tanstack/react-virtual`
- [ ] Обернуть VideoGrid в виртуализированный список
- [ ] Динамическая высота карточек (aspect ratio preservation)
- [ ] Тестирование на списках > 1000 элементов

**Метрика**: Снижение начального рендера с 200ms до 50ms на 500 видео.

### 12.2 Responsive Images с srcset (TD-26)

- [ ] Генерация превью разных размеров:
  - Thumbnail: 320x180
  - Medium: 640x360
  - Large: 1280x720

- [ ] Обновить VideoCard:
  ```tsx
  <img
    srcSet={`
      ${thumb.url_320} 320w,
      ${thumb.url_640} 640w,
      ${thumb.url_1280} 1280w
    `}
    sizes="(max-width: 640px) 320px, (max-width: 1024px) 640px, 1280px"
    src={thumb.url_640}
    alt={title}
  />
  ```

**Метрика**: Снижение трафика на 40% на мобильных устройствах.

### 12.3 Dark/Light Mode (TD-28)

- [ ] CSS переменные для цветовых тем:

  ```css
  :root {
    --bg-primary: #1a1a1a;
    --text-primary: #ffffff;
  }

  [data-theme='light'] {
    --bg-primary: #ffffff;
    --text-primary: #000000;
  }
  ```

- [ ] Переключатель в Navigation
- [ ] Сохранение выбора в localStorage
- [ ] Поддержка `prefers-color-scheme`

### 12.4 Keyboard Shortcuts

- [ ] Глобальные hotkeys:
  - `J` — предыдущее видео
  - `K` — следующее видео
  - `Esc` — закрыть модалку
  - `/` — фокус на поиск
  - `?` — показать справку по hotkeys

- [ ] Компонент KeyboardShortcutsHelp
- [ ] ARIA live region для анонса действий

### 12.5 Request Tracing (TD-23)

- [ ] Middleware для генерации requestId:

  ```javascript
  // server/middleware/tracing.js
  import { randomUUID } from 'crypto';

  export const requestTracing = (req, res, next) => {
    req.id = req.headers['x-request-id'] || randomUUID();
    res.setHeader('X-Request-ID', req.id);
    next();
  };
  ```

- [ ] Логирование requestId во всех entry points
- [ ] Передача в заголовках прокси-запросов
- [ ] Frontend: добавление X-Request-ID в fetch

### 12.6 Monitoring & Observability (TD-27)

#### Prometheus метрики:

- [ ] Установить `prom-client`
- [ ] Метрики:
  - `http_requests_total` (counter) — количество запросов
  - `http_request_duration_seconds` (histogram) — время ответа
  - `rutube_api_requests_total` (counter) — запросы к Rutube
  - `llm_api_requests_total` (counter) — запросы к LLM
  - `cache_hit_ratio` (gauge) — эффективность кэша

- [ ] Endpoint `GET /metrics` для Prometheus scraping

#### Grafana дашборды:

- [ ] Дашборд HTTP-метрик (RPS, latency, errors)
- [ ] Дашборд бизнес-метрик (видео, каналы, пользователи)
- [ ] Дашборд кэша (hit rate, TTL)

#### Structured JSON Logging:

- [ ] Формат логов:

  ```json
  {
    "timestamp": "2026-02-23T10:00:00Z",
    "level": "info",
    "requestId": "uuid",
    "message": "Request completed",
    "duration": 145,
    "statusCode": 200
  }
  ```

- [ ] Log aggregation (опционально: ELK stack, Loki)

### 12.7 Kubernetes Manifests

- [ ] **Deployment**: replicas, resource limits, liveness/readiness probes
- [ ] **Service**: ClusterIP для внутренней коммуникации
- [ ] **Ingress**: NGINX с TLS termination
- [ ] **ConfigMap**: env переменные
- [ ] **Secret**: API ключи, JWT секреты
- [ ] **PersistentVolumeClaim**: для логов и кэша

### 12.8 API Versioning

- [ ] Префикс `/api/v1/` для всех routes
- [ ] Подготовка к `/api/v2/` (breaking changes)
- [ ] Deprecation headers для старых версий

### 12.9 Storybook Component Library

- [ ] Установить Storybook 7+
- [ ] Stories для всех UI компонентов:
  - VideoCard (разные состояния)
  - Navigation (разные темы)
  - Modals (все типы)
  - Buttons, Inputs, Filters

- [ ] Accessibility addon для a11y проверок
- [ ] Docs addon для автогенерации документации

**Результат**: Production-ready инфраструктура, advanced UX features, полная observability.

---

## 🎯 Метрики прогресса

| Метрика                      | Было (до 2026-02-12) | Текущее (2026-02-23)      | Цель (Этапы 8-12) | Статус  |
| ---------------------------- | -------------------- | ------------------------- | ----------------- | ------- |
| **Этапов завершено**         | 0 из 9               | **9 из 9 (100%)** ✅      | 14 из 14 (100%)   | 🟡 64%  |
| **App.tsx строк**            | ~1947                | **24** ✅                 | < 50              | ✅ Done |
| **server/index.js строк**    | ~893                 | **52** ✅                 | < 100             | ✅ Done |
| **Специализированных хуков** | 0                    | **22** ✅                 | 25                | 🟡 88%  |
| **Тестов всего**             | 0                    | **522** (100% pass) ✅    | 700+              | 🟡 75%  |
| **Покрытие (lines)**         | 0%                   | **49.23%**                | **70%+**          | 🔴 70%  |
| **Покрытие (functions)**     | 0%                   | **57.87%**                | **80%+**          | 🟡 72%  |
| **Использований `any`**      | 15+ (только сервисы) | **0** ✅                  | **0**             | ✅ Done |
| **isMounted паттернов**      | 26                   | **0** ✅                  | 0                 | ✅ Done |
| **Прямых localStorage**      | 27                   | **1** ✅                  | 0                 | 🟢 P2   |
| **CI/CD jobs**               | 0                    | **5** ✅                  | 7 (+ E2E + a11y)  | 🟡 71%  |
| **Документов**               | ~5                   | **30** (10293 строк) ✅   | 35+               | 🟡 86%  |
| **ARIA атрибутов**           | 0                    | **79** ✅                 | 85+               | 🟡 93%  |
| **WCAG AA compliance**       | Нет                  | **17/18 критериев** ✅    | 18/18 + Auto      | 🟡 94%  |
| **Docker образ (prod)**      | Нет                  | **330MB** (Alpine) ✅     | < 350MB           | ✅ Done |
| **PWA**                      | Нет                  | **Да** (SW + manifest) ✅ | + Push + Sync     | 🟡 60%  |
| **Аутентификация**           | Нет                  | **Схема готова**          | **Реализована**   | 🔴 Open |
| **E2E тесты**                | Нет                  | **Конфиг готов**          | **10+ сценариев** | 🔴 Open |
| **Prisma ORM**               | Нет                  | **Схема готова** ✅       | + Миграции        | 🟡 50%  |

### Декомпозиция кода (детально)

| Модуль                    | Строк     | Δ от начала       | Комментарий                                    |
| ------------------------- | --------- | ----------------- | ---------------------------------------------- |
| **src/App.tsx**           | **24**    | **-1923 ↓ 98.8%** | Минимальный оркестратор                        |
| **server/index.js**       | **52**    | **-841 ↓ 94.2%**  | Точка входа с импортами                        |
| **src/index.tsx**         | 111       | —                 | ErrorBoundary + инициализация                  |
| **src/hooks/** (22 файла) | **3414**  | **+3414 ↑**       | Специализированные хуки (было 0)               |
| **src/components/** (18)  | 5046      | **+2000 ↑**       | UI компоненты + скелетоны + модалки            |
| **src/services/** (6)     | 2649      | **+1500 ↑**       | rutubeService, storageService, indexedDB и др. |
| **src/types/** (5 файлов) | **546**   | **+546 ↑**        | Модульные типы (было 0)                        |
| **src/utils/**            | 150       | —                 | Утилиты                                        |
| **server/** (12 файлов)   | 1082      | **+189 ↑**        | Модульная серверная архитектура                |
| **Итого frontend (src/)** | **11940** | **+3757 ↑**       | Рост за счёт хуков, типов, сервисов            |
| **Тесты** (35 файлов)     | **6993**  | **+5778 ↑**       | 522 теста (401 frontend + 121 backend)         |
| **Документация** (30)     | **10293** | **+8482 ↑**       | Полная документация проекта                    |

---

## ✅ Контрольные критерии успеха (из CODE_REVIEW.md)

> Эта таблица показывает, какие метрики должны быть достигнуты по завершении Этапов 8-12.

| Метрика                      | Было (2026-02-12)    | Текущее (2026-02-23)     | Цель               | Приоритет | Этап |
| ---------------------------- | -------------------- | ------------------------ | ------------------ | --------- | ---- |
| App.tsx строк                | 1947                 | **24** ✅                | < 50               | ✅ Done   | —    |
| server/index.js строк        | 893                  | **52** ✅                | < 100              | ✅ Done   | —    |
| `any` типов                  | 15+ (только сервисы) | **0** ✅                 | **0**              | ✅ Done   | 9.1  |
| isMounted паттернов          | 26                   | **0** ✅                 | 0                  | ✅ Done   | —    |
| Прямых localStorage вызовов  | 27                   | **1** (ErrorBoundary) ✅ | 0                  | 🟢 P2     | —    |
| Покрытие тестами (lines)     | 0%                   | **49.23%**               | **70%+**           | 🟡 P1     | 11.1 |
| Покрытие тестами (functions) | 0%                   | **57.87%**               | **80%+**           | 🟡 P1     | 11.1 |
| Количество тестов            | 0                    | **522** ✅               | **700+**           | 🟡 P1     | 11   |
| ESLint + Prettier            | Нет                  | **Да** ✅                | Да                 | ✅ Done   | —    |
| CI/CD pipeline               | Нет                  | **5 jobs** ✅            | **+ E2E + a11y**   | 🟡 P1     | 11   |
| Docker multi-stage           | Нет                  | **4 stages** ✅          | + BuildKit cache   | 🟢 P2     | 12   |
| WCAG AA                      | Нет                  | **79 ARIA** ✅           | **Автоматический** | 🟢 P2     | 11.3 |
| Аутентификация               | Нет                  | **Спланирована**         | **Реализована**    | 🔴 P0     | 8    |
| E2E тесты                    | Нет                  | **Конфиг готов**         | **10+ сценариев**  | 🟡 P1     | 11.2 |
| PWA                          | Нет                  | **Да** ✅                | + Push + Sync      | 🟢 P2     | 12   |
| Prisma ORM                   | Нет                  | **Схема готова** ✅      | **+ Миграции**     | 🔴 P0     | 8.4  |

---

## 📊 Реестр технического долга

> **Источник**: CODE_REVIEW.md - Новый реестр технического долга (TD-17 → TD-28)

| ID    | Элемент                                         | Приоритет | Сложность | Этап | Статус    |
| ----- | ----------------------------------------------- | --------- | --------- | ---- | --------- |
| TD-17 | ~~Устранить 29 оставшихся `any` типов~~         | ✅ P0     | Средняя   | 9.1  | ✅ Закрыт |
| TD-18 | Реализовать auth систему (JWT + Prisma)         | 🔴 P0     | Высокая   | 8    | ❌ Открыт |
| TD-19 | Установить Playwright + запустить E2E           | 🟡 P1     | Низкая    | 9.5  | ❌ Открыт |
| TD-20 | Разделить useAppComposition (545 строк)         | 🟡 P1     | Средняя   | 9.2  | ❌ Открыт |
| TD-21 | Увеличить покрытие тестами до 70%+              | 🟡 P1     | Средняя   | 11.1 | ❌ Открыт |
| TD-22 | Синхронизировать .nvmrc (18) с Docker (20)      | 🟡 P1     | Низкая    | 9.4  | ❌ Открыт |
| TD-23 | Добавить request tracing (requestId)            | 🟡 P1     | Низкая    | 12.5 | ❌ Открыт |
| TD-24 | Автоматический a11y аудит в CI (axe-core)       | 🟢 P2     | Низкая    | 11.3 | ❌ Открыт |
| TD-25 | Виртуализация списков (@tanstack/react-virtual) | 🟢 P2     | Средняя   | 12.1 | ❌ Открыт |
| TD-26 | srcset для responsive images                    | 🟢 P2     | Низкая    | 12.2 | ❌ Открыт |
| TD-27 | Monitoring/observability (Prometheus + Grafana) | 🟢 P2     | Высокая   | 12.6 | ❌ Открыт |
| TD-28 | Dark/light mode переключатель                   | 🟢 P2     | Средняя   | 12.3 | ❌ Открыт |

### Закрытые элементы технического долга (TD-1 → TD-16)

<details>
<summary>Показать историю закрытых элементов (16 шт.)</summary>

| ID    | Элемент                                  | Статус    | Дата закрытия |
| ----- | ---------------------------------------- | --------- | ------------- |
| TD-1  | Удалить `geminiService.ts`               | ✅ Закрыт | 2026-02-12    |
| TD-2  | Убрать `@ts-ignore`                      | ✅ Закрыт | 2026-02-12    |
| TD-3  | Зафиксировать версии                     | ✅ Закрыт | 2026-02-12    |
| TD-4  | Заменить `confirm()`/`alert()`           | ✅ Закрыт | 2026-02-12    |
| TD-5  | Декомпозиция App.tsx на хуки             | ✅ Закрыт | 2026-02-17    |
| TD-6  | Декомпозиция server/index.js             | ✅ Закрыт | 2026-02-17    |
| TD-7  | Перенос в `src/` + алиасы                | ✅ Закрыт | 2026-02-17    |
| TD-8  | Zod/Valibot валидация                    | ✅ Закрыт | 2026-02-17    |
| TD-9  | ESLint + Prettier + husky                | ✅ Закрыт | 2026-02-12    |
| TD-10 | Compression middleware                   | ✅ Закрыт | 2026-02-12    |
| TD-11 | Удалить пустые директории-дубликаты      | ✅ Закрыт | 2026-02-08    |
| TD-12 | Health check эндпоинт                    | ✅ Закрыт | 2026-02-08    |
| TD-13 | Заменить isMounted на AbortController    | ✅ Закрыт | 2026-02-17    |
| TD-14 | StorageService (абстракция localStorage) | ✅ Закрыт | 2026-02-17    |
| TD-15 | Синхронизировать ARCHITECTURE.md         | ✅ Закрыт | 2026-02-17    |
| TD-16 | Env validation при старте сервера        | ✅ Закрыт | 2026-02-12    |

</details>

---

## 🔮 Дополнительные идеи для будущего (P3 — Опциональные)

> Эти улучшения не входят в основной план развития (Этапы 8-12), но могут быть реализованы по необходимости.

### Производительность

- [ ] **Web Workers** для тяжёлых вычислений (парсинг больших плейлистов)
- [ ] **Brotli compression** для статических ресурсов (вместо gzip)
- [ ] **HTTP/2 Server Push** для критических ресурсов
- [ ] **Code splitting** по маршрутам (React.lazy + Suspense)
- [ ] **Preloading** критических данных (rel="preload")

### Тестирование

- [ ] **Mutation testing** (Stryker) для проверки качества тестов
- [ ] **Performance testing** (Lighthouse CI) в pipeline
- [ ] **Load testing** (k6, Artillery) для API endpoints
- [ ] **Contract testing** (Pact) для API версионирования

### UX

- [ ] **Infinite scroll** вместо пагинации (опционально)
- [ ] **Gesture support** для мобильных (swipe для навигации)
- [ ] **Multi-language support** (i18n) - английский, русский
- [ ] **User preferences sync** между устройствами
- [ ] **Offline-first mode** с full data synchronization

### DevOps

- [ ] **Blue-Green deployment** стратегия
- [ ] **Canary releases** для постепенного rollout
- [ ] **Feature flags** система (LaunchDarkly, Unleash)
- [ ] **Distributed tracing** (Jaeger, Zipkin)
- [ ] **Error tracking** (Sentry)

---

## 📅 Рекомендуемая последовательность выполнения этапов

> **Оптимальный путь развития** с учётом зависимостей между этапами.

### Фаза 1: Критический фундамент (2-3 недели)

**Порядок выполнения:**

1. **Этап 9 (2-3 дня)** — Устранение технического долга
   - Обязательно начать с TD-17 (устранение `any`)
   - Установка Playwright для последующих E2E тестов
   - Синхронизация Node версий

2. **Этап 8 (3-5 дней)** — Аутентификация
   - Требует чистую кодовую базу после Этапа 9
   - Блокирует серверную синхронизацию данных
   - Критично для production deployment

3. **Этап 11 (2-3 дня)** — Тестирование и качество
   - E2E тесты для auth flow из Этапа 8
   - Увеличение покрытия до 70%+
   - Автоматический a11y аудит

**Итого**: ~7-11 дней | **Результат**: Production-ready база с аутентификацией и 70%+ покрытием тестами.

### Фаза 2: Расширение функциональности (3-5 дней)

4. **Этап 10** — MetaInfo TV + Playlist Auto-Import
   - Требует готовую auth систему (Этап 8)
   - Расширяет продуктовую ценность
   - Использует уже готовую инфраструктуру кэширования

**Итого**: ~3-5 дней | **Результат**: Уникальные продуктовые фичи, конкурентное преимущество.

### Фаза 3: Масштабирование и observability (5-7 дней)

5. **Этап 12** — Продвинутые фичи
   - Виртуализация списков для производительности
   - Monitoring и observability для production
   - Dark mode, keyboard shortcuts для UX

**Итого**: ~5-7 дней | **Результат**: Enterprise-grade приложение с полной observability.

---

## 🎯 Ключевые вехи (Milestones)

| Milestone                   | Этапы | Сроки      | Ключевые результаты                                    |
| --------------------------- | ----- | ---------- | ------------------------------------------------------ |
| **M1: Чистая кодовая база** | 9     | Неделя 1   | 0 `any` типов, E2E ready, улучшенная архитектура хуков |
| **M2: Auth система**        | 8     | Неделя 2   | JWT auth, Prisma миграции, серверная синхронизация     |
| **M3: Качество 70%+**       | 11    | Неделя 3   | 70%+ покрытие, E2E тесты, a11y audit в CI              |
| **M4: Продуктовые фичи**    | 10    | Неделя 4   | MetaInfo TV, Playlist auto-import                      |
| **M5: Production-ready**    | 12    | Неделя 5-6 | Monitoring, виртуализация, advanced UX                 |

---

## 🔍 Быстрый старт: что делать в первую очередь

### Если хочется быстрых улучшений (1-2 дня):

1. **TD-22**: Синхронизировать Node версии (5 минут)
2. **TD-19**: Установить Playwright (30 минут)
3. **TD-26**: Добавить srcset для images (2-3 часа)
4. **TD-28**: Dark/light mode (1 день)

### Если нужна максимальная бизнес-ценность (1 неделя):

1. **Этап 9.1**: Устранить 29 `any` (2 дня)
2. **Этап 8.1-8.5**: Базовая auth система (3 дня)
3. **Этап 11.2**: Критические E2E тесты (1 день)

### Если приоритет — production deployment (2 недели):

Выполнить **Фазу 1 полностью** (Этапы 9 → 8 → 11)

---

## 📊 Визуализация зависимостей этапов

```
Этап 9 (Техдолг)
    ↓
    ├─→ Этап 8 (Auth) ──→ Этап 10 (MetaInfo TV + Playlists)
    │       ↓
    └─→ Этап 11 (Testing 70%+)
            ↓
        Этап 12 (Advanced Features)
```

**Критический путь**: 9 → 8 → 11 → 10 → 12

---

## 📝 Примечания

**Последние обновления:**

- **2026-02-23**: Добавлен расширенный план развития (Этапы 8-12) на основе CODE_REVIEW.md
- **2026-02-17**: Завершён Этап 7 (UX и доступность) — PWA + WCAG AA
- **2026-02-17**: Завершён Этап 6 (Docker и деплой) — multi-stage build
- **2026-02-17**: Завершён Этап 5 (Тестирование и CI/CD) — 522 теста
- **2026-02-17**: Завершён Этап 4 (Производительность и UX) — IndexedDB + debounce
- **2026-02-17**: Завершён Этап 3 (Типизация и валидация) — 0 `any` в сервисах

**Статистика проекта:**

- **Всего этапов**: 14 (-1 → 12)
- **Завершено**: 9 (64%)
- **В работе**: 0
- **Запланировано**: 5 (36%)
- **Технический долг**: 12 элементов (16 закрыто, 12 открыто)
- **Общее время разработки**: ~11 дней (2026-02-12 → 2026-02-23)
- **Оценка оставшихся этапов**: 15-22 дня

**Ссылки на документацию:**

- [CODE_REVIEW.md](docs/CODE_REVIEW.md) — детальный код-ревью и план развития (583 строки)
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — архитектура проекта
- [TYPE_SYSTEM.md](docs/TYPE_SYSTEM.md) — система типов и валидация
- [PERFORMANCE.md](docs/PERFORMANCE.md) — оптимизации производительности
- [TESTING_REPORT_STAGE5.md](docs/TESTING_REPORT_STAGE5.md) — отчёт по тестированию
- [ACCESSIBILITY_REPORT.md](docs/ACCESSIBILITY_REPORT.md) — отчёт по доступности WCAG AA
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) — руководство по деплою (338 строк)
- [AUTH_IMPLEMENTATION_PLAN.md](docs/AUTH_IMPLEMENTATION_PLAN.md) — план auth системы (594 строки)
- [DB_SCHEMA_AUTH.md](docs/DB_SCHEMA_AUTH.md) — схема БД для аутентификации (937 строк)
- [CHANGELOG.md](CHANGELOG.md) — история изменений

**Следующие шаги:**

1. Выбрать фазу/milestone для работы
2. Создать feature branch для этапа
3. Следовать чек-листу задач из соответствующего этапа
4. Запускать тесты после каждого значительного изменения
5. Обновлять метрики прогресса и отмечать выполненные задачи
6. Документировать архитектурные решения (ADR при необходимости)
