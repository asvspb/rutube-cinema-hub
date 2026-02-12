# Код‑ревью проекта Rutube Cinema Hub
Дата: 2026-02-08
Обновлено: 2026-02-12 (третья итерация — аудит прогресса и актуализация)

## Цель документа
Оценить текущее состояние проекта, зафиксировать прогресс с момента предыдущего ревью, выявить новые и оставшиеся проблемы, предложить усиленный план развития.

---

## Прогресс с предыдущего ревью (2026-02-09 → 2026-02-12)

> Из 10 элементов технического долга **6 закрыты**, из 7 этапов плана **частично выполнены этапы -1, 0, 4, 6**.

| # | Элемент | Статус | Комментарий |
|---|---------|--------|-------------|
| TD-1 | Удалить `geminiService.ts` | ✅ Закрыт | Файл удалён |
| TD-2 | Убрать `@ts-ignore` | ✅ Закрыт | Убран из App.tsx |
| TD-3 | Зафиксировать версии | ✅ Закрыт | `clsx: "2.1.1"`, `tailwind-merge: "2.6.0"` |
| TD-4 | Заменить `confirm()`/`alert()` | ✅ Закрыт | `ConfirmModal` + `NotificationModal` |
| TD-5 | Декомпозиция App.tsx | ⚠️ Частично | 12 компонентов вынесены, но App.tsx **вырос** 1846→1947 строк |
| TD-6 | Декомпозиция server/index.js | ❌ Не начат | Вырос 635→893 строки |
| TD-7 | Перенос в `src/` + алиасы | ✅ Закрыт | `src/`, `@/` алиасы настроены |
| TD-8 | Zod/Valibot валидация | ❌ Не начат | — |
| TD-9 | ESLint + Prettier | ❌ Не начат | — |
| TD-10 | Compression middleware | ❌ Не начат | — |

### Дополнительно реализовано (сверх плана)
- ✅ **Helmet** с CSP, frameguard, noSniff, referrerPolicy
- ✅ **CORS whitelist** (ALLOWED_ORIGINS из env)
- ✅ **Rate limiting** на proxy и AI эндпоинтах
- ✅ **Domain validation** + блокировка приватных IP + DNS resolution check
- ✅ **Logger service** (`loggerService.ts`) с серверной отправкой логов
- ✅ **LLM service** (`llmService.ts`) — клиентский модуль для AI API
- ✅ **ADR** (2 записи: мульти-стратегия, dual LLM)
- ✅ **Документация**: `ARCHITECTURE.md`, `STATE_MANAGEMENT.md`, `PROXY_SECURITY.md`, `DEV_SERVER_SETUP.md`
- ✅ **Docker** (`docker-compose.yml` с frontend + backend)
- ✅ **Env precedence** (process.env > .env.local > .env)
- ✅ **Global error handlers** (unhandledRejection, uncaughtException на сервере)
- ✅ **Тесты**: 7 файлов (security, API validation, Mistral stub/external, application)

---

## Краткий обзор архитектуры
- **Frontend**: React 18.3.1 + TypeScript + Tailwind CSS + Framer Motion 11.0.24.
- **Backend**: Express 5.2.1 (`server/index.js`, 893 строк) с прокси `/api/proxy` и эндпоинтами KinoRate AI.
- **Безопасность**: Helmet (CSP), CORS whitelist, rate limiting, domain validation, private IP blocking.
- **Интеграции**: Rutube API/скрапинг (мульти-стратегия), LLM провайдеры (Gemini/Mistral) с авто-fallback.
- **Сборка**: Vite 6.2.0 (dev-сервер :9229, прокси API на :9230).
- **Визуализация**: Recharts 2.12.3 для графиков рейтингов.
- **Контейнеризация**: Docker Compose (frontend + backend).

### Метрики кодовой базы (актуальные)
| Файл / Модуль | Строк | Δ от ревью | Назначение |
|---|---|---|---|
| `src/App.tsx` | **1947** | +101 ↑ | Главный компонент (монолит): 52 useState, 21 useEffect |
| `src/services/rutubeService.ts` | 970 | +1 | Ядро: парсинг, прокси, рейтинг (15 `any` типов) |
| `server/index.js` | **893** | +258 ↑ | Backend: прокси + AI + security (монолит) |
| `src/components/KinoRate/KinoRateModal.tsx` | 599 | новый | KinoRate AI модалка |
| `src/components/FormulaSettingsModal.tsx` | 489 | новый | Настройки формулы рейтинга |
| `src/components/VideoCard.tsx` | 445 | +97 ↑ | Карточка видео с рейтингами |
| `src/components/CategoryFilter.tsx` | 296 | новый | Фильтр категорий |
| `src/components/ImportPlaylistsModal.tsx` | 237 | новый | Импорт плейлистов |
| `src/services/top250Data.ts` | 228 | -1 | Локальная база фильмов |
| `src/services/loggerService.ts` | 128 | новый | Сервис логирования |
| `src/types.ts` | 88 | = | Доменные типы |
| `src/services/llmService.ts` | 48 | новый | Клиент LLM API |
| Остальные компоненты (8 шт.) | 797 | новые | Модалки, хедеры, UI |
| `src/hooks/` | **0** | = | ⚠️ Пустая директория |
| `src/types/` | **0** | = | ⚠️ Пустая директория |
| **Итого frontend** | **~8183** | — | — |
| **Тесты** | ~1215 | новые | 7 файлов |
| **Документация** | ~1811 | новые | 11 файлов + 2 ADR |

### Поток данных (Data Flow)
```
Rutube API/HTML ──→ rutubeService (мульти-стратегия) ──→ App.tsx state ──→ VideoCard
                         ↑                                      ↓
                    Proxy (local, domain-validated)         localStorage (27 вызовов)
                         ↑                                      ↓
                    Helmet + CORS + Rate Limit           metadataCache (persist)
                                                                ↓
Movie title ──→ top250Data (локальная БД) ──→ LLM API (Gemini→Mistral fallback) ──→ KinoRate UI
                                                    ↑
                                              loggerService ──→ server/logs/
```

## Сильные стороны и как их усилить

### Архитектурные решения

1) **Мульти-стратегия извлечения данных из Rutube (API → Redux state → HTML scraping → regex).**
   - Полноценный pipeline с graceful degradation: если API недоступен, извлекаем данные из Redux-стейта в HTML, затем из скриптов через regex.
   - Код: `rutubeService.ts` — стратегии `fetchChannelVideos`, `extractFromReduxState`, `extractFromScripts`.
   - Усиление: добавить метрики успешности каждой стратегии; версионировать парсеры для быстрого отката.

2) **Гибридное проксирование с race-логикой и статус-трекингом.**
   - Локальный прокси (`:9230`) + публичные прокси (codetabs.com) с отслеживанием статуса (up/down/unknown).
   - Proxy race: параллельный запуск с выбором первого успешного ответа.
   - Усиление: circuit breaker паттерн; конфигурация прокси через env; метрики латентности.

3) **Dual LLM Provider с авто-fallback (Gemini → Mistral).**
   - Сервер автоматически определяет доступных провайдеров по наличию API-ключей.
   - При ошибке одного провайдера — прозрачный переход на другой.
   - JSON-схема для Gemini (`responseSchema`) снижает галлюцинации.
   - Grounding через Google Search для актуальных данных.
   - Усиление: кэшировать ответы LLM (TTL 7 дней); метрики стоимости/качества по провайдерам.

4) **Локальная база фильмов (Top 250/1000) как first-pass перед AI.**
   - Умная оптимизация: сначала ищем в локальной базе (~1250 фильмов), и только при отсутствии — вызываем LLM.
   - Fuzzy-matching по названию с нормализацией и scoring.
   - Усиление: расширить базу; добавить автообновление из открытых источников.

5) **ErrorBoundary с механизмом восстановления (`index.tsx`).**
   - При критической ошибке — очистка localStorage и перезагрузка.
   - Глобальные обработчики `window.onerror` и `unhandledrejection`.
   - Интеграция с `loggerService` для отправки crash-отчётов на сервер.
   - Усиление: показывать пользователю детали ошибки; добавить retry без полного сброса.

6) **Cursor-based пагинация с дедупликацией.**
   - `seenCursors` Set предотвращает зацикливание при загрузке страниц.
   - Cache-busting timestamps на API-запросах.
   - Усиление: добавить виртуализацию списка для больших коллекций.

7) **Многоуровневая безопасность прокси (новое ✅).**
   - Helmet с CSP, frameguard, noSniff, referrerPolicy.
   - CORS whitelist (ALLOWED_ORIGINS из env).
   - Rate limiting на proxy и AI эндпоинтах (настраиваемые лимиты через env).
   - Domain validation с wildcard поддержкой (`*.rutube.ru`).
   - DNS resolution + блокировка приватных IP (IPv4 + IPv6).
   - Redirect following с лимитом (PROXY_MAX_REDIRECTS).
   - Усиление: добавить request size limits; WAF-подобные правила; audit log.

### UX и продуктовые решения

8) **Богатая UI-логика и UX-детали.**
   - Скелетоны загрузки, модалки, fallback-изображения, drag-and-drop для каналов/плейлистов.
   - Система статусов видео (liked/watched/watch_later) с циклическим переключением.
   - Множественные варианты сортировки и настраиваемая сетка (2/3/4 колонки).
   - **Новое**: ConfirmModal и NotificationModal вместо нативных диалогов.
   - Усиление: e2e тесты (Playwright); UX-гайд в `docs/UX_GUIDE`.

9) **Двойной режим пользователя (гость / залогиненный).**
   - Раздельные ключи localStorage для разных профилей.
   - Усиление: миграция на IndexedDB; опциональная серверная синхронизация.

10) **KinoRate AI как уникальная продуктовая фича.**
    - Обогащение метаданных фильмов (IMDb, KP, награды) через AI.
    - Визуализация рейтингов через Recharts.
    - Batch-режим для массового анализа.
    - Top 250/900 списки с поиском и пагинацией.
    - Усиление: объяснимые оценки (breakdown факторов); A/B сравнение формул.

### Инфраструктура и качество

11) **Сервисный слой и типизация.**
    - 4 сервиса: `rutubeService`, `llmService`, `loggerService`, `top250Data`.
    - Типы в `types.ts` (88 строк, 8 интерфейсов).
    - Усиление: разделить типы по контекстам; внедрить Zod/Valibot для runtime-валидации.

12) **Зрелая документация (новое ✅).**
    - 11 документов + 2 ADR: `ARCHITECTURE.md`, `STATE_MANAGEMENT.md`, `PROXY_SECURITY.md`, `PROJECT_RULES.md`.
    - Скрипты разработки: `dev-all-in-one.sh`, `smoke-test.sh`, `monitor-error-logs.sh`.
    - Усиление: синхронизировать ARCHITECTURE.md с реальным состоянием (сейчас описывает целевое).

13) **Серверное логирование (новое ✅).**
    - `loggerService.ts`: перехват console.error/warn, отправка на `/api/logs`.
    - Серверная запись в `server/logs/error_logs.json` (ротация: последние 1000 записей).
    - Global handlers: `unhandledRejection`, `uncaughtException`.
    - Усиление: структурированные JSON-логи; requestId/traceId; уровни логирования в prod.

14) **Docker-поддержка (новое ✅).**
    - `docker-compose.yml` с frontend + backend сервисами.
    - Настраиваемый proxy target через env.
    - Усиление: multi-stage build для production; health checks в compose; кэширование node_modules.

## Текущие проблемы и рекомендуемые решения

### 🔴 Критические (требуют немедленного внимания)

1) **App.tsx — растущий монолит (1947 строк, +101 с прошлого ревью).**
   - 52 хука `useState` (было 30+), 21 `useEffect`, 27 прямых вызовов `localStorage`.
   - 26 паттернов `isMounted` (хрупкий, подвержен race conditions).
   - Inline-компоненты: `Pagination` (строки 36-101), `RecommendedChannelCard` (строки 104-146).
   - Интерфейс `CachedPlaylistData` определён внутри файла (строка 148).
   - **Проблема**: компоненты вынесены, но логика осталась — файл растёт вместо того, чтобы уменьшаться.
   - **Решение**: приоритетная декомпозиция на хуки (`useChannels`, `useVideoCache`, `useFilters`, `useHistory`, `useVideoStatuses`, `useSearch`, `useModals`). Заменить `isMounted` на `AbortController`. Создать `StorageService`.

2) **server/index.js — растущий монолит (893 строки, +258 с прошлого ревью).**
   - Роуты, middleware, LLM-логика, прокси, конфигурация, утилиты — всё в одном файле.
   - Дублирование паттернов: `kinoRateSearch` и `kinoRateBatch` содержат идентичную fallback-логику.
   - **Решение**: `server/routes/`, `server/services/`, `server/middleware/`, `server/config/`.

3) **Пустые директории-призраки.**
   - `src/hooks/` — пустая (все хуки inline в App.tsx).
   - `src/types/` — пустая (types.ts в корне src/).
   - `src/components/components/` — дубликат, пустая.
   - `src/services/services/` — дубликат, пустая.
   - **Решение**: удалить дубликаты; заполнить hooks/ и types/ при декомпозиции.

4) **ARCHITECTURE.md описывает целевое состояние, а не текущее.**
   - Показывает `hooks/useChannels.ts`, `types/rutube.ts`, `server/routes/` — ничего из этого не существует.
   - Вводит в заблуждение новых разработчиков.
   - **Решение**: разделить на «Текущая архитектура» и «Целевая архитектура» или пометить секции.

### 🟡 Важные (влияют на качество и масштабируемость)

5) **15 типов `any` в `rutubeService.ts`.**
   - `parseProxyResponse`, `mapRutubeItem`, `fetchSinglePage`, `findVideosInRedux`, `extractVideosFromHtml`, `scrapeVideosFromHtml` и др.
   - **Решение**: типизировать через интерфейсы; добавить Zod-схемы для внешних данных.

6) **`(this as any)` в `index.tsx:85`.**
   - Обход типизации в ErrorBoundary.
   - **Решение**: использовать `this.props.children` с правильной типизацией.

7) **Отсутствие ESLint / Prettier / pre-commit hooks.**
   - Нет автоматического контроля качества кода.
   - **Решение**: настроить ESLint + Prettier + lint-staged + husky.

8) **Нет health check эндпоинта.**
   - Невозможно мониторить состояние сервера, Docker health checks не работают.
   - **Решение**: добавить `GET /health` с проверкой зависимостей (LLM providers status).

9) **Нет compression middleware.**
   - Ответы не сжимаются (gzip/brotli).
   - **Решение**: добавить `compression` middleware.

10) **Нет валидации environment variables при старте.**
    - Сервер молча работает без API-ключей.
    - **Решение**: проверять обязательные переменные при запуске, выводить предупреждения.

11) **26 паттернов `isMounted` в App.tsx.**
    - Хрупкий подход к отмене async-операций, подвержен race conditions.
    - **Решение**: заменить на `AbortController` + `signal` в fetch-запросах.

12) **27 прямых вызовов `localStorage` в App.tsx.**
    - Нет абстракции, нет обработки ошибок (QuotaExceededError), нет миграций.
    - **Решение**: создать `StorageService` с типизированным API, обработкой ошибок, версионированием схемы.

13) **Docker Compose: `npm install` при каждом запуске.**
    - Нет кэширования `node_modules`, медленный старт.
    - **Решение**: multi-stage Dockerfile с кэшированием слоёв; или volume для node_modules.

### 🟢 Улучшения (повысят зрелость проекта)

14) **Нет `.nvmrc` файла.**
    - **Решение**: добавить `.nvmrc` с версией Node.js 18.

15) **Нет CI/CD pipeline.**
    - **Решение**: GitHub Actions: lint → typecheck → test → build → smoke.

16) **Нет debounce на поисковом вводе.**
    - **Решение**: добавить debounce (300ms) на `searchQuery`.

17) **Нет виртуализации длинных списков.**
    - Все карточки в DOM при большом количестве видео.
    - **Решение**: `react-window` или `@tanstack/virtual`.

18) **Нет `srcset` для responsive images.**
    - **Решение**: добавить `srcset` для обложек видео.

---

## Аудит безопасности (обновлённый)

| Находка | Серьёзность | Статус | Рекомендация |
|---|---|---|---|
| CORS whitelist | ✅ Реализовано | Закрыт | ALLOWED_ORIGINS из env |
| Rate limiting | ✅ Реализовано | Закрыт | proxy + AI эндпоинты |
| Helmet CSP | ✅ Реализовано | Закрыт | CSP, frameguard, noSniff |
| Domain validation | ✅ Реализовано | Закрыт | Allowlist + DNS check |
| Private IP blocking | ✅ Реализовано | Закрыт | IPv4 + IPv6 |
| Redirect limit | ✅ Реализовано | Закрыт | PROXY_MAX_REDIRECTS |
| Нет санитизации пользовательского ввода | 🟡 Средняя | Открыт | XSS-фильтрация названий каналов/плейлистов |
| Нет request size limits | 🟡 Средняя | Открыт | Ограничить размер body (express.json limit) |
| Нет HTTPS enforcement | 🟡 Средняя | Открыт | Настроить при публикации |
| API-ключи только через env | 🟢 Хорошо | Закрыт | Уже реализовано ✓ |

---

## Аудит производительности (обновлённый)

| Область | Текущее состояние | Рекомендация |
|---|---|---|
| Рендеринг списка видео | Полный ре-рендер при изменении state | `React.memo` для VideoCard, `useMemo` для фильтрации |
| Большие списки | Все карточки в DOM | Виртуализация (`react-window` / `@tanstack/virtual`) |
| Изображения | `loading="lazy"` ✓ | Добавить `srcset` для responsive images |
| Поиск | Нет debounce | Добавить debounce (300ms) на поисковый ввод |
| Bundle size | Не анализировался | Добавить `rollup-plugin-visualizer` |
| Кэш видео | In-memory (теряется при обновлении) | Миграция на IndexedDB для персистентного кэша |
| Сервер | Нет compression | Добавить gzip/brotli middleware |
| isMounted паттерн | 26 экземпляров (хрупкий) | Заменить на AbortController |

---

## Аудит доступности (a11y)

| Проблема | Влияние | Рекомендация |
|---|---|---|
| Нет ARIA-атрибутов на интерактивных элементах | Screen readers не работают | Добавить `aria-label`, `role`, `aria-expanded` |
| Нет управления фокусом в модалках | Tab-навигация ломается | Focus trap в модальных окнах |
| Нет skip-to-content ссылки | Клавиатурная навигация затруднена | Добавить skip link |
| Цветовой контраст не проверен | Может не соответствовать WCAG | Аудит контрастности |
| Нет `alt` текстов с описанием | Изображения недоступны | Улучшить alt-тексты |
| ~~Нативные `confirm()`/`alert()`~~ | ~~Блокируют UI~~ | ✅ Заменены на ConfirmModal/NotificationModal |

## Лучшие практики (что уже соблюдается)
- **TypeScript** для типобезопасности (кроме 15 `any` в rutubeService).
- **Tailwind CSS** — утилитарный подход, единообразие стилей.
- **Framer Motion** — плавные анимации, drag-and-drop для каналов/плейлистов.
- **Lazy loading** изображений (`loading="lazy"`).
- **Env-конфигурация** с приоритетами (process.env > .env.local > .env).
- **ADR** для ключевых архитектурных решений.
- **Скрипты автоматизации**: smoke-test, monitor-logs, dev-all-in-one.
- **Модальные окна** вместо нативных диалогов (ConfirmModal, NotificationModal).

## Конкурентные преимущества и точки роста

| Преимущество | Текущее состояние | Потенциал роста |
|---|---|---|
| **KinoRate AI** — обогащение метаданных через LLM | Gemini + Mistral fallback, batch-режим | Кэширование ответов (TTL 7д); объяснимые оценки; A/B формул |
| **Мульти-стратегия парсинга Rutube** | 4 стратегии с graceful degradation | Метрики успешности стратегий; версионирование парсеров |
| **Гибридное проксирование** | Local + public proxy race | Circuit breaker; метрики латентности; конфигурация через env |
| **Локальная база фильмов** | Top 250/900 с fuzzy-matching | Автообновление из открытых источников; расширение базы |
| **Drag-and-drop управление** | Каналы и плейлисты через Framer Motion | Drag-and-drop для категорий; сохранение порядка |

---

## Реестр технического долга (обновлённый)

| # | Элемент | Приоритет | Сложность | Статус |
|---|---------|-----------|-----------|--------|
| TD-1 | ~~Удалить `geminiService.ts`~~ | — | — | ✅ Закрыт |
| TD-2 | ~~Убрать `@ts-ignore`~~ | — | — | ✅ Закрыт |
| TD-3 | ~~Зафиксировать версии~~ | — | — | ✅ Закрыт |
| TD-4 | ~~Заменить `confirm()`/`alert()`~~ | — | — | ✅ Закрыт |
| TD-5 | Декомпозиция App.tsx на хуки | 🔴 P0 | Высокая | ⚠️ Частично |
| TD-6 | Декомпозиция server/index.js | 🔴 P0 | Высокая | ❌ Открыт |
| TD-7 | ~~Перенос в `src/` + алиасы~~ | — | — | ✅ Закрыт |
| TD-8 | Zod/Valibot валидация | 🟡 P1 | Средняя | ❌ Открыт |
| TD-9 | ESLint + Prettier + husky | 🟡 P1 | Низкая | ❌ Открыт |
| TD-10 | Compression middleware | 🟡 P1 | Низкая | ❌ Открыт |
| TD-11 | Удалить пустые директории-дубликаты | 🔴 P0 | Низкая | ❌ **Новый** |
| TD-12 | Health check эндпоинт | 🟡 P1 | Низкая | ❌ **Новый** |
| TD-13 | Заменить isMounted на AbortController | 🟡 P1 | Средняя | ❌ **Новый** |
| TD-14 | StorageService (абстракция localStorage) | 🟡 P1 | Средняя | ❌ **Новый** |
| TD-15 | Синхронизировать ARCHITECTURE.md с реальностью | 🟡 P1 | Низкая | ❌ **Новый** |
| TD-16 | Env validation при старте сервера | 🟡 P1 | Низкая | ❌ **Новый** |

---

## Усиленный план развития

### Этап -1: Мгновенные исправления (1-2 часа)
- [ ] Удалить пустые директории: `src/components/components/`, `src/services/services/`
- [ ] Добавить `.nvmrc` с версией Node.js 18
- [ ] Добавить `GET /health` эндпоинт в server/index.js
- [ ] Добавить env validation при старте сервера (предупреждения о недостающих ключах)
- [ ] Исправить `(this as any)` в `index.tsx:85`

### Этап 0: Инфраструктура качества (4-6 часов)
- [ ] Настроить ESLint (flat config) + Prettier + lint-staged + husky
- [ ] Добавить `compression` middleware на сервер
- [ ] Добавить `express.json({ limit: '1mb' })` для ограничения размера запросов
- [ ] Настроить `rollup-plugin-visualizer` для анализа bundle size
- [ ] GitHub Actions: lint → typecheck → test → build

### Этап 1: Декомпозиция App.tsx — хуки (2-3 дня)
> **Цель**: App.tsx < 500 строк, `src/hooks/` заполнена.

- [ ] Создать `useChannels.ts` — управление каналами (useState + useEffect для каналов)
- [ ] Создать `useVideoCache.ts` — кэширование видео (metadataCache, localStorage)
- [ ] Создать `useFilters.ts` — фильтрация, сортировка, поиск (с debounce)
- [ ] Создать `useHistory.ts` — история просмотров
- [ ] Создать `useVideoStatuses.ts` — liked/watched/watch_later
- [ ] Создать `useModals.ts` — управление модальными окнами
- [ ] Создать `useSearch.ts` — поисковая логика с debounce
- [ ] Создать `StorageService.ts` — типизированная абстракция localStorage
- [ ] Заменить все 26 `isMounted` на `AbortController`
- [ ] Вынести inline-компоненты: `Pagination`, `RecommendedChannelCard`
- [ ] Перенести `CachedPlaylistData` в `types.ts`

### Этап 2: Декомпозиция server/index.js (1-2 дня)
> **Цель**: server/index.js < 100 строк (точка входа).

```
server/
  index.js          — точка входа (<100 строк)
  config/
    env.js          — загрузка и валидация env
    cors.js         — CORS конфигурация
  middleware/
    security.js     — Helmet, rate limiting
    logging.js      — request logging
    validation.js   — domain validation, IP blocking
  routes/
    health.js       — GET /health
    proxy.js        — /api/proxy
    ai.js           — /api/ai/*
    logs.js         — /api/logs
  services/
    llm.js          — Gemini/Mistral клиенты, fallback логика
    jsonParser.js   — утилиты парсинга JSON
```

### Этап 3: Типизация и валидация (1-2 дня)
- [ ] Устранить 15 `any` в `rutubeService.ts` — создать интерфейсы для API-ответов
- [ ] Перенести `types.ts` в `src/types/index.ts`
- [ ] Разделить типы: `types/rutube.ts`, `types/kinorate.ts`, `types/ui.ts`
- [ ] Добавить Zod-схемы для валидации внешних данных (Rutube API, LLM ответы)
- [ ] Включить `strict: true` в tsconfig.json (если ещё не включён)

### Этап 4: Производительность (1-2 дня)
- [ ] `React.memo` для VideoCard и других тяжёлых компонентов
- [ ] `useMemo` / `useCallback` для фильтрации и сортировки
- [ ] Виртуализация списков (`@tanstack/virtual` или `react-window`)
- [ ] Debounce на поисковом вводе (300ms)
- [ ] `srcset` для responsive images
- [ ] Кэширование LLM-ответов (TTL 7 дней, IndexedDB или серверный кэш)
- [ ] Миграция видео-кэша на IndexedDB

### Этап 5: Тестирование и CI/CD (2-3 дня)
- [ ] Unit-тесты для хуков (Vitest + React Testing Library)
- [ ] Unit-тесты для серверных сервисов
- [ ] Integration-тесты для API-эндпоинтов (supertest)
- [ ] E2E-тесты для критических сценариев (Playwright)
- [ ] Покрытие > 60% для бизнес-логики
- [ ] GitHub Actions pipeline: lint → typecheck → test → build → smoke

### Этап 6: Docker и деплой (1 день)
- [ ] Multi-stage Dockerfile (build → production)
- [ ] Кэширование node_modules в Docker (COPY package*.json → npm ci → COPY .)
- [ ] Health checks в docker-compose.yml
- [ ] Docker Compose profiles (dev / prod)
- [ ] Документация по деплою в `docs/DEPLOYMENT.md`

### Этап 7: UX и доступность (ongoing)
- [ ] ARIA-атрибуты на интерактивных элементах
- [ ] Focus trap в модальных окнах
- [ ] Skip-to-content ссылка
- [ ] Аудит цветового контраста (WCAG AA)
- [ ] Улучшение alt-текстов для изображений
- [ ] PWA: manifest.json + service worker (offline-режим для кэшированных данных)

---

## Целевая архитектура (после рефакторинга)

```
rutube-cinema-hub/
  src/
    App.tsx                    (<500 строк — оркестратор)
    index.tsx                  (ErrorBoundary + инициализация)
    components/
      VideoCard.tsx
      VideoModal.tsx
      KinoRate/
        KinoRateModal.tsx
        RatingChart.tsx
      FormulaSettingsModal.tsx
      CategoryFilter.tsx
      ImportPlaylistsModal.tsx
      ChannelHeader.tsx
      AddChannelModal.tsx
      AddCategoryModal.tsx
      HistoryModal.tsx
      ConfirmModal.tsx
      NotificationModal.tsx
      Pagination.tsx           (вынести из App.tsx)
      RecommendedChannelCard.tsx (вынести из App.tsx)
    hooks/
      useChannels.ts
      useVideoCache.ts
      useFilters.ts
      useHistory.ts
      useVideoStatuses.ts
      useModals.ts
      useSearch.ts
    services/
      rutubeService.ts
      llmService.ts
      loggerService.ts
      storageService.ts        (новый — абстракция localStorage)
      top250Data.ts
    types/
      index.ts                 (реэкспорт)
      rutube.ts
      kinorate.ts
      ui.ts
  server/
    index.js                   (<100 строк — точка входа)
    config/
      env.js
      cors.js
    middleware/
      security.js
      logging.js
      validation.js
    routes/
      health.js
      proxy.js
      ai.js
      logs.js
    services/
      llm.js
      jsonParser.js
  tests/
    unit/
    integration/
    e2e/
  docs/
    ARCHITECTURE.md            (синхронизирована с реальностью)
    CODE_REVIEW.md
    STATE_MANAGEMENT.md
    PROXY_SECURITY.md
    DEV_SERVER_SETUP.md
    PROJECT_RULES.md
    adr/
      001-use-multi-strategy-data-fetching-from-rutube.md
      002-use-dual-llm-provider-with-auto-fallback.md
  .eslintrc.js
  .prettierrc
  .nvmrc
  .github/
    workflows/
      ci.yml
  docker-compose.yml
  Dockerfile
```

---

## Контрольные критерии успеха

| Метрика | Текущее | Цель | Приоритет |
|---|---|---|---|
| App.tsx строк | 1947 | < 500 | 🔴 P0 |
| server/index.js строк | 893 | < 100 | 🔴 P0 |
| `any` типов в TS | 15+ | 0 | 🟡 P1 |
| `isMounted` паттернов | 26 | 0 | 🟡 P1 |
| Прямых вызовов localStorage | 27 | 0 (через StorageService) | 🟡 P1 |
| Пустых директорий | 4 | 0 | 🔴 P0 |
| ESLint ошибок | N/A (не настроен) | 0 | 🟡 P1 |
| Тестовое покрытие | ~0% (только smoke) | > 60% бизнес-логики | 🟡 P1 |
| Health check | Нет | GET /health | 🟡 P1 |
| CI/CD | Нет | GitHub Actions | 🟢 P2 |
| Lighthouse Performance | Не измерен | > 90 | 🟢 P2 |
| WCAG AA compliance | Нет | Базовый уровень | 🟢 P2 |
| Bundle size | Не измерен | < 500KB gzipped | 🟢 P2 |
| Docker build time | ~2 мин (npm install каждый раз) | < 30 сек (кэш) | 🟢 P2 |

---

> **Итого**: проект демонстрирует значительный прогресс — 6/10 элементов техдолга закрыты, добавлена серьёзная инфраструктура безопасности, документация и тесты. Главный вызов — декомпозиция двух монолитных файлов (App.tsx и server/index.js), которые продолжают расти. Рекомендуется начать с Этапа -1 (мгновенные исправления) и Этапа 1 (декомпозиция App.tsx на хуки), так как это разблокирует все последующие улучшения.
