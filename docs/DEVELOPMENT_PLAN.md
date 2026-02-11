# План разработки (приоритеты)

## P0 — Немедленные исправления (1–2 дня)
1. Удалить `services/geminiService.ts` (мёртвый код).
2. Убрать `@ts-ignore` в `App.tsx`.
3. Зафиксировать версии `clsx`, `tailwind-merge`.
4. Добавить `GET /health`.
5. Ограничить CORS allowlist.

## P1 — Безопасность и стабильность (3–5 дней)
1. Rate limit на `/api/proxy` и `/api/ai/*`.
2. Запрет приватных IP/localhost в прокси.
3. Валидировать все входные данные (Zod/Valibot).
4. Включить `compression`.

## P2 — Декомпозиция монолитов (1–2 недели)
1. Разделить `App.tsx` на hooks + UI-компоненты.
2. Разделить `server/index.js` на `routes/`, `services/`, `middleware/`.
3. Вынести абстракцию `StorageService`.

## P3 — Тестирование (1–2 недели)
1. Unit-тесты `rutubeService` (API/Redux/Regex стратегии).
2. Integration-тесты `/api/proxy` и `/api/ai/*`.
3. E2E Playwright для основных пользовательских сценариев.

## P4 — Производительность и UX (1–2 недели)
1. Виртуализация списка видео.
2. Debounce на поиск.
3. Оптимизация рендеров `VideoCard`.

## P5 — Observability (1 неделя)
1. Correlation ID и structured logs.
2. Метрики по прокси и LLM.

## P6 — Архитектурная стандартизация (1–2 недели)
1. Перенос к `src/`.
2. Алиасы `@/`.
3. Валидация данных через Zod.

**Дата обновления**: 2026-02-09
