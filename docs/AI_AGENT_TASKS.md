# Технические задания для AI-агентов

## Агент 1: Безопасность и прокси
**Цель**: повысить безопасность `/api/proxy`.
**Задачи**:
- Реализовать allowlist доменов (`rutube.ru`, `*.rutube.ru`).
- Блокировка приватных IP/localhost.
- Rate limit `express-rate-limit`.
- CORS whitelist.

## Агент 2: Декомпозиция App.tsx
**Цель**: `App.tsx` < 300 строк.
**Задачи**:
- Вынести состояние в хуки: `useChannels`, `useVideoCache`, `useFilters`.
- Разделить UI на `Header`, `VideoGrid`, `Modals`, `Sidebar`.
- Удалить `@ts-ignore`.

## Агент 3: Backend рефакторинг
**Цель**: разделить `server.js`.
**Задачи**:
- Вынести роуты в `server/routes/`.
- Вынести LLM логику в `server/services/llm.js`.
- Добавить `/health`.

## Агент 4: Тестирование
**Цель**: покрытие 70% сервисов.
**Задачи**:
- Vitest для `rutubeService.ts`.
- Integration тесты proxy/LLM.

## Агент 5: Производительность
**Цель**: оптимизация больших списков.
**Задачи**:
- Виртуализация списка.
- `React.memo` + `useMemo`.
- Debounce поиска.

**Дата обновления**: 2026-02-09
