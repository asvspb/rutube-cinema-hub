# Стратегия тестирования Rutube Cinema Hub

**Последнее обновление:** 2026-02-17 (Этап 5 завершён)

**Текущий статус:** ✅ 522 теста, 100% прохождение, 49.23% покрытие

---

## Цели

Обеспечить комплексное покрытие приложения **Rutube Cinema Hub** тестами для раннего обнаружения ошибок и гарантии работоспособности кода.

---

## 📊 ТЕКУЩЕЕ СОСТОЯНИЕ ТЕСТИРОВАНИЯ

### ✅ Что уже покрыто тестами

**Frontend (Vitest + React Testing Library):**

- ✅ `useFilters.test.ts` - фильтрация видео
- ✅ `usePagination.test.ts` - пагинация
- ✅ `useSearch.test.ts` - поиск
- ✅ `useUIState.test.ts` - состояние UI
- ✅ `useVideoCache.test.ts` - кеширование видео
- ✅ `storageService.test.ts` - работа с localStorage
- ✅ `loggerService.test.ts` - логирование (⚠️ 2 failing теста)
- ✅ `VideoCard.test.tsx` - карточка видео (⚠️ 4 failing теста)

**Backend (Node.js test runner + Supertest):**

- ✅ `proxy-router.test.js` - роутер прокси
- ✅ `proxy-integration.test.js` - интеграция прокси
- ✅ `security-middleware.test.js` - безопасность
- ✅ `validation.test.js` - валидация
- ✅ `rutube-service.test.js` - сервис Rutube
- ✅ `ai-api.mistral.stub.test.js` - AI API
- ✅ `ai-api.validation.test.js` - валидация AI
- ✅ `mistral.external.test.js` - внешний API

**Текущая статистика:**

- 📊 107 тестов (101 passed, 6 failed)
- 📦 8 тестовых файлов для frontend
- 📦 8 тестовых файлов для backend

---

## ❌ КРИТИЧЕСКИЕ ПРОБЕЛЫ В ПОКРЫТИИ

### 🎣 Hooks - 21 файл, только 7 покрыто (33% покрытие)

**КРИТИЧНО - НЕ ПОКРЫТО:**

1. ⚠️ `useAppLogic.ts` - основная бизнес-логика приложения
2. ⚠️ `useChannels.ts` - управление каналами (229 строк!)
3. ⚠️ `useVideoLogic.ts` - логика загрузки и обработки видео
4. ⚠️ `useModals.ts` - управление модальными окнами

**ВАЖНО - НЕ ПОКРЫТО:** 5. ⚠️ `useAppComposition.ts` - композиция приложения 6. ⚠️ `useCategoryEffects.ts` - эффекты категорий 7. ⚠️ `useChannelMenu.ts` - меню каналов 8. ⚠️ `useActiveMenuChannel.ts` - активное меню 9. ⚠️ `useHistory.ts` - история просмотров 10. ⚠️ `useVideoStatuses.ts` - статусы видео (liked, watched) 11. ⚠️ `useSortingAndGrid.ts` - сортировка и grid 12. ⚠️ `useRefreshHandler.ts` - обновление данных

**НИЗКИЙ ПРИОРИТЕТ:** 13. ⚠️ `useGridClass.ts` - CSS классы сетки 14. ⚠️ `useMainContentProps.ts` - пропсы контента 15. ⚠️ `useMetadata.ts` - метаданные 16. ⚠️ `useNavigationProps.ts` - пропсы навигации

### 🧩 Components - 18 файлов, только 1 покрыт (5.5% покрытие)

**МОДАЛЬНЫЕ ОКНА - НЕ ПОКРЫТО:**

1. ⚠️ `AddChannelModal.tsx` - добавление каналов
2. ⚠️ `AddCategoryModal.tsx` - добавление категорий
3. ⚠️ `VideoModal.tsx` - просмотр видео
4. ⚠️ `KinoRateModal.tsx` - рейтинги фильмов
5. ⚠️ `FormulaSettingsModal.tsx` - настройки формул
6. ⚠️ `HistoryModal.tsx` - история просмотров
7. ⚠️ `ImportPlaylistsModal.tsx` - импорт плейлистов
8. ⚠️ `ConfirmModal.tsx` - подтверждения
9. ⚠️ `NotificationModal.tsx` - уведомления

**ОСНОВНЫЕ КОМПОНЕНТЫ - НЕ ПОКРЫТО:** 10. ⚠️ `Navigation.tsx` - главная навигация 11. ⚠️ `MainContent.tsx` - основной контент 12. ⚠️ `ChannelHeader.tsx` - шапка канала 13. ⚠️ `CategoryFilter.tsx` - фильтр категорий 14. ⚠️ `Pagination.tsx` - пагинация 15. ⚠️ `RecommendedChannelCard.tsx` - карточки рекомендаций 16. ⚠️ `RatingChart.tsx` - графики рейтингов 17. ⚠️ `UIComponents.tsx` - базовые UI компоненты

### 🔧 Services - 5 файлов, 2 покрыто (40% покрытие)

**КРИТИЧНО - НЕ ПОКРЫТО:**

1. ⚠️ **`rutubeService.ts`** - 1123 строки, сложнейшая логика API, формулы рейтингов!
2. ⚠️ **`llmService.ts`** - AI функционал, интеграция с LLM

**НЕ ПОКРЫТО:** 3. ⚠️ `top250Data.ts` - данные топ-250

### 🖥️ Server Routes - требует дополнительного покрытия

**НЕ ПОЛНОСТЬЮ ПОКРЫТО:**

1. ⚠️ `ai.js` - AI эндпоинты (batch, search)
2. ⚠️ `health.js` - health check
3. ⚠️ `logs.js` - серверное логирование

---

## 🎯 СТРАТЕГИЯ ТЕСТИРОВАНИЯ

### Уровень 1: Unit Tests (Изолированные тесты)

**Цель:** Тестирование отдельных функций/компонентов в изоляции  
**Инструменты:** Vitest, React Testing Library, Node.js test runner  
**Покрытие:** Hooks, Services, Utils, Components

### Уровень 2: Integration Tests (Интеграционные тесты)

**Цель:** Тестирование взаимодействия между компонентами  
**Инструменты:** Vitest, Supertest  
**Покрытие:** API routes, Component workflows, Service integration

### Уровень 3: E2E Tests (Сквозные тесты)

**Цель:** Тестирование пользовательских сценариев  
**Инструменты:** Playwright (рекомендуется добавить)  
**Покрытие:** Critical user flows

---

## 📝 ДЕТАЛЬНЫЙ ПЛАН ПО ФАЗАМ

### 🔴 ФАЗА 1: КРИТИЧНЫЕ КОМПОНЕНТЫ (Приоритет HIGH)

#### 1.1 Services - Сервисный слой

**`tests/frontend/rutubeService.test.ts`** ⭐ КРИТИЧНО (1123 строки кода!)

```typescript
describe('RutubeService', () => {
  describe('fetchVideos', () => {
    it('should successfully fetch videos from channel', async () => {});
    it('should successfully fetch videos from playlist', async () => {});
    it('should handle network errors gracefully', async () => {});
    it('should handle invalid API response', async () => {});
    it('should correctly paginate (has_next, next URL)', async () => {});
    it('should respect timeout limits', async () => {});
    it('should support retry logic on failures', async () => {});
    it('should cancel requests with AbortController', async () => {});
  });

  describe('fetchChannelInfo', () => {
    it('should fetch channel information', async () => {});
    it('should handle non-existent channel', async () => {});
    it('should cache channel data', async () => {});
  });

  describe('fetchAllVideos', () => {
    it('should load all pages sequentially', async () => {});
    it('should stop on error', async () => {});
    it('should call progress callback', async () => {});
    it('should respect max page limit', async () => {});
  });

  describe('calculateVideoRating', () => {
    it('should calculate using standard formula', async () => {});
    it('should calculate using experimental formula (threshold-based)', async () => {});
    it('should calculate gravity score', async () => {});
    it('should handle edge cases (0 views, old videos)', async () => {});
    it('should apply custom rating settings', async () => {});
  });

  describe('parseChannelIdFromUrl', () => {
    it('should parse channel URL format 1', async () => {});
    it('should parse channel URL format 2', async () => {});
    it('should handle invalid URLs', async () => {});
  });

  describe('searchChannelByName', () => {
    it('should find channel by name', async () => {});
    it('should handle empty results', async () => {});
    it('should handle search errors', async () => {});
  });

  describe('fetchRecommendedChannels', () => {
    it('should fetch recommended channels', async () => {});
    it('should filter already added channels', async () => {});
  });
});
```

**Тестовые сценарии:**

- ✅ Успешная загрузка данных из разных источников
- ✅ Обработка всех типов ошибок (сеть, API, валидация)
- ✅ Корректность формул расчета рейтингов
- ✅ Пагинация и FetchAll режим
- ✅ AbortController для отмены запросов
- ✅ Кеширование и retry логика

---

**`tests/frontend/llmService.test.ts`** ⭐ КРИТИЧНО

```typescript
describe('LLMService', () => {
  describe('searchMovieRatings', () => {
    it('should successfully search movie ratings', async () => {});
    it('should handle API errors', async () => {});
    it('should handle 404 responses', async () => {});
    it('should handle timeout', async () => {});
    it('should validate response structure', async () => {});
    it('should return null on invalid data', async () => {});
  });

  describe('analyzeBatchWithAgent', () => {
    it('should process batch requests', async () => {});
    it('should handle empty array', async () => {});
    it('should handle partial failures in batch', async () => {});
    it('should respect batch size limits', async () => {});
    it('should handle timeout for long batches', async () => {});
  });
});
```

**Тестовые сценарии:**

- ✅ Успешный поиск и batch обработка
- ✅ Обработка ошибок API
- ✅ Валидация ответов
- ✅ Timeout и retry логика

---

#### 1.2 Core Hooks - Основные хуки

**`tests/frontend/useAppLogic.test.ts`** 🔴 HIGH

```typescript
describe('useAppLogic', () => {
  it('should handle category changes', () => {});
  it('should reset pagination on category change', () => {});
  it('should clear search on category change', () => {});
  it('should refresh data correctly', () => {});
  it('should handle home vs channel mode', () => {});
  it('should clear cache on refresh', () => {});
  it('should update rating settings', () => {});
  it('should update grid columns', () => {});
  it('should handle fetchAll mode toggle', () => {});
});
```

---

**`tests/frontend/useChannels.test.ts`** 🔴 HIGH

```typescript
describe('useChannels', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Channel Management', () => {
    it('should load channels from localStorage', () => {});
    it('should add new channel', () => {});
    it('should prevent duplicate channels', () => {});
    it('should delete channel', () => {});
    it('should not delete system channels', () => {});
    it('should edit channel name', () => {});
    it('should persist changes to localStorage', () => {});
  });

  describe('Playlist Management', () => {
    it('should load playlists for channel', async () => {});
    it('should add playlist to channel', () => {});
    it('should delete playlist from channel', () => {});
    it('should not delete system playlists', () => {});
    it('should handle errors loading playlists', async () => {});
  });

  describe('Active Channel', () => {
    it('should set active channel', () => {});
    it('should switch between channels', () => {});
    it('should return to home', () => {});
  });
});
```

---

**`tests/frontend/useVideoLogic.test.ts`** 🔴 HIGH

```typescript
describe('useVideoLogic', () => {
  describe('Video Loading', () => {
    it('should load videos from channel', async () => {});
    it('should load videos from playlist', async () => {});
    it('should handle FetchAll mode', async () => {});
    it('should set loading state correctly', async () => {});
    it('should handle load errors', async () => {});
    it('should cache results', async () => {});
  });

  describe('AbortController', () => {
    it('should cancel request on unmount', async () => {});
    it('should cancel request on new load', async () => {});
  });

  describe('Rating Calculation', () => {
    it('should apply rating formulas', async () => {});
    it('should apply custom rating settings', async () => {});
  });

  describe('Pagination', () => {
    it('should handle next page URL', async () => {});
    it('should disable next if no more pages', async () => {});
  });
});
```

---

**`tests/frontend/useModals.test.ts`** 🔴 HIGH

```typescript
describe('useModals', () => {
  it('should open modal', () => {});
  it('should close modal', () => {});
  it('should manage multiple modals', () => {});
  it('should pass data to modal', () => {});
  it('should clear data on close', () => {});

  describe('Specific Modals', () => {
    it('should manage AddChannelModal state', () => {});
    it('should manage VideoModal state', () => {});
    it('should manage KinoRateModal state', () => {});
    it('should manage ConfirmModal state', () => {});
  });
});
```

---

**`tests/frontend/useVideoStatuses.test.ts`** 🔴 HIGH

```typescript
describe('useVideoStatuses', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should mark video as liked', () => {});
  it('should unmark video as liked', () => {});
  it('should mark video as watched', () => {});
  it('should mark video as watch_later', () => {});
  it('should get video statuses', () => {});
  it('should persist to localStorage', () => {});
  it('should load from localStorage', () => {});
  it('should handle multiple videos', () => {});
});
```

---

**`tests/frontend/useHistory.test.ts`** 🔴 HIGH

```typescript
describe('useHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should add video to history', () => {});
  it('should get history', () => {});
  it('should clear history', () => {});
  it('should limit history size', () => {});
  it('should update timestamp on re-watch', () => {});
  it('should persist to localStorage', () => {});
  it('should filter history by status', () => {});
});
```

---

**`tests/frontend/useSortingAndGrid.test.ts`** 🟡 MEDIUM

```typescript
describe('useSortingAndGrid', () => {
  it('should sort by date', () => {});
  it('should sort by rating', () => {});
  it('should sort alphabetically', () => {});
  it('should sort by views', () => {});
  it('should sort by trend (gravity)', () => {});
  it('should change grid columns', () => {});
  it('should persist grid preference', () => {});
  it('should persist sort preference', () => {});
});
```

---

### 🟡 ФАЗА 2: UI КОМПОНЕНТЫ (Приоритет MEDIUM)

#### 2.1 Модальные окна

**`tests/frontend/AddChannelModal.test.tsx`** 🟡 MEDIUM

```typescript
describe('AddChannelModal', () => {
  it('should render modal', () => {});
  it('should show input for channel URL', () => {});
  it('should validate URL format', () => {});
  it('should load channel info on valid URL', async () => {});
  it('should show error on invalid URL', () => {});
  it('should show loading state', () => {});
  it('should save channel on submit', () => {});
  it('should close modal on cancel', () => {});
  it('should prevent duplicate channels', () => {});
  it('should handle API errors', async () => {});
});
```

---

**`tests/frontend/AddCategoryModal.test.tsx`** 🟡 MEDIUM

```typescript
describe('AddCategoryModal', () => {
  it('should render modal', () => {});
  it('should create new category', () => {});
  it('should validate category name', () => {});
  it('should import playlist by URL', async () => {});
  it('should validate playlist URL', () => {});
  it('should handle import errors', async () => {});
  it('should show loading during import', () => {});
  it('should close on success', () => {});
});
```

---

**`tests/frontend/VideoModal.test.tsx`** 🟡 MEDIUM

```typescript
describe('VideoModal', () => {
  const mockVideo = {
    id: '123',
    title: 'Test Video',
    description: 'Test Description',
    thumbnail_url: 'http://example.com/thumb.jpg',
    duration: 3600,
    views: 1000,
    created_ts: '2024-01-01',
    video_url: 'http://example.com/video',
    html: '<iframe></iframe>',
    rating: 8.5,
    gravity: 5.2,
  };

  it('should render video information', () => {});
  it('should render embed player', () => {});
  it('should show action buttons (like, watch later, watched)', () => {});
  it('should toggle like status', () => {});
  it('should toggle watch later status', () => {});
  it('should toggle watched status', () => {});
  it('should open KinoRate modal', () => {});
  it('should close on ESC key', () => {});
  it('should close on backdrop click', () => {});
  it('should not close on modal content click', () => {});
});
```

---

**`tests/frontend/KinoRateModal.test.tsx`** 🟡 MEDIUM

```typescript
describe('KinoRateModal', () => {
  it('should render modal', () => {});
  it('should search for movie ratings', async () => {});
  it('should display KP rating', () => {});
  it('should display IMDB rating', () => {});
  it('should display movie description', () => {});
  it('should show loading state', () => {});
  it('should handle search errors', async () => {});
  it('should handle batch mode', async () => {});
  it('should show grounding sources', () => {});
  it('should display awards info', () => {});
});
```

---

**`tests/frontend/FormulaSettingsModal.test.tsx`** 🟡 MEDIUM

```typescript
describe('FormulaSettingsModal', () => {
  it('should render current settings', () => {});
  it('should change ratingBase', () => {});
  it('should change ratingLogScale', () => {});
  it('should change gravityHourOffset', () => {});
  it('should change gravityPower', () => {});
  it('should toggle experimental strategy', () => {});
  it('should validate numeric inputs', () => {});
  it('should reset to defaults', () => {});
  it('should save settings to localStorage', () => {});
  it('should trigger recalculation on save', () => {});
});
```

---

**`tests/frontend/HistoryModal.test.tsx`** 🟡 MEDIUM

```typescript
describe('HistoryModal', () => {
  it('should render history list', () => {});
  it('should filter by status (all, liked, watched, watch_later)', () => {});
  it('should show empty state', () => {});
  it('should open video from history', () => {});
  it('should clear history', () => {});
  it('should paginate long history', () => {});
  it('should show video thumbnails', () => {});
});
```

---

**`tests/frontend/ImportPlaylistsModal.test.tsx`** 🟡 MEDIUM

```typescript
describe('ImportPlaylistsModal', () => {
  it('should load channel playlists', async () => {});
  it('should show loading state', () => {});
  it('should select playlists for import', () => {});
  it('should import selected playlists', async () => {});
  it('should show import progress', () => {});
  it('should handle import errors', async () => {});
  it('should close on completion', () => {});
});
```

---

**`tests/frontend/ConfirmModal.test.tsx`** 🟡 MEDIUM

```typescript
describe('ConfirmModal', () => {
  it('should render confirmation message', () => {});
  it('should call onConfirm on OK', () => {});
  it('should call onCancel on Cancel', () => {});
  it('should close on confirm', () => {});
  it('should close on cancel', () => {});
});
```

---

**`tests/frontend/NotificationModal.test.tsx`** 🟡 MEDIUM

```typescript
describe('NotificationModal', () => {
  it('should render notification', () => {});
  it('should show success type', () => {});
  it('should show error type', () => {});
  it('should show info type', () => {});
  it('should auto-close after timeout', async () => {});
  it('should close on manual click', () => {});
});
```

---

#### 2.2 Основные компоненты

**`tests/frontend/Navigation.test.tsx`** 🟡 MEDIUM

```typescript
describe('Navigation', () => {
  it('should render navigation', () => {});
  it('should render channel list', () => {});
  it('should highlight active channel', () => {});
  it('should switch to home on home button click', () => {});
  it('should switch to channel on channel click', () => {});
  it('should open add channel modal', () => {});
  it('should show channel menu on context click', () => {});
  it('should be responsive (mobile/desktop)', () => {});
});
```

---

**`tests/frontend/MainContent.test.tsx`** 🟡 MEDIUM

```typescript
describe('MainContent', () => {
  it('should render video grid', () => {});
  it('should apply 2 column grid', () => {});
  it('should apply 3 column grid', () => {});
  it('should apply 4 column grid', () => {});
  it('should show loading state', () => {});
  it('should show empty state', () => {});
  it('should show error state', () => {});
  it('should render pagination', () => {});
  it('should render search bar', () => {});
  it('should render category filter', () => {});
});
```

---

**`tests/frontend/ChannelHeader.test.tsx`** 🟡 MEDIUM

```typescript
describe('ChannelHeader', () => {
  it('should render channel info', () => {});
  it('should show avatar', () => {});
  it('should show banner', () => {});
  it('should show subscriber count', () => {});
  it('should show action buttons', () => {});
  it('should show loading state', () => {});
});
```

---

**`tests/frontend/CategoryFilter.test.tsx`** 🟡 MEDIUM

```typescript
describe('CategoryFilter', () => {
  it('should render category list', () => {});
  it('should highlight active category', () => {});
  it('should switch category on click', () => {});
  it('should show video count per category', () => {});
  it('should open add category modal', () => {});
  it('should show delete button for non-system categories', () => {});
});
```

---

**`tests/frontend/Pagination.test.tsx`** 🟡 MEDIUM

```typescript
describe('Pagination', () => {
  it('should render page numbers', () => {});
  it('should highlight current page', () => {});
  it('should navigate to next page', () => {});
  it('should navigate to previous page', () => {});
  it('should disable prev on first page', () => {});
  it('should disable next on last page', () => {});
  it('should show ellipsis for many pages', () => {});
  it('should jump to specific page', () => {});
});
```

---

**`tests/frontend/RecommendedChannelCard.test.tsx`** 🟡 MEDIUM

```typescript
describe('RecommendedChannelCard', () => {
  it('should render channel card', () => {});
  it('should show avatar', () => {});
  it('should show channel name', () => {});
  it('should show subscriber count', () => {});
  it('should add channel on click', () => {});
  it('should show hover effects', () => {});
});
```

---

**`tests/frontend/RatingChart.test.tsx`** 🟡 MEDIUM

```typescript
describe('RatingChart', () => {
  it('should render chart', () => {});
  it('should display rating data', () => {});
  it('should show tooltip on hover', () => {});
  it('should show legend', () => {});
  it('should be responsive', () => {});
});
```

---

**`tests/frontend/UIComponents.test.tsx`** 🟡 MEDIUM

```typescript
describe('UIComponents', () => {
  describe('Button', () => {
    it('should render primary variant', () => {});
    it('should render secondary variant', () => {});
    it('should render danger variant', () => {});
    it('should handle disabled state', () => {});
    it('should handle loading state', () => {});
    it('should handle click', () => {});
  });

  describe('Input', () => {
    it('should render text input', () => {});
    it('should handle value changes', () => {});
    it('should show error state', () => {});
    it('should show placeholder', () => {});
  });

  // ... другие UI компоненты
});
```

---

### 🟢 ФАЗА 3: ВСПОМОГАТЕЛЬНЫЕ HOOKS (Приоритет LOW)

**`tests/frontend/useAppComposition.test.ts`** 🟢 LOW
**`tests/frontend/useCategoryEffects.test.ts`** 🟢 LOW
**`tests/frontend/useChannelMenu.test.ts`** 🟢 LOW
**`tests/frontend/useActiveMenuChannel.test.ts`** 🟢 LOW
**`tests/frontend/useGridClass.test.ts`** 🟢 LOW
**`tests/frontend/useMainContentProps.test.ts`** 🟢 LOW
**`tests/frontend/useMetadata.test.ts`** 🟢 LOW
**`tests/frontend/useNavigationProps.test.ts`** 🟢 LOW
**`tests/frontend/useRefreshHandler.test.ts`** 🟢 LOW

_(Детальные спецификации доступны по запросу)_

---

### 🔴 ФАЗА 4: SERVER ROUTES (Приоритет HIGH)

**`tests/ai-router.test.js`** 🔴 HIGH (дополнить существующие)

```javascript
describe('AI Router', () => {
  describe('POST /api/ai/kinorate/search', () => {
    it('should search movie ratings successfully', async () => {});
    it('should validate query parameter', async () => {});
    it('should handle LLM errors', async () => {});
    it('should handle timeout', async () => {});
    it('should apply rate limiting', async () => {});
    it('should fallback to secondary provider', async () => {});
  });

  describe('POST /api/ai/kinorate/batch', () => {
    it('should process batch requests', async () => {});
    it('should limit batch size', async () => {});
    it('should handle partial failures', async () => {});
    it('should track progress', async () => {});
  });
});
```

---

**`tests/health-router.test.js`** 🟡 MEDIUM

```javascript
describe('Health Router', () => {
  describe('GET /api/health', () => {
    it('should return OK status', async () => {});
    it('should check dependencies', async () => {});
  });
});
```

---

**`tests/logs-router.test.js`** 🟡 MEDIUM

```javascript
describe('Logs Router', () => {
  describe('POST /api/logs', () => {
    it('should receive client logs', async () => {});
    it('should validate log format', async () => {});
    it('should apply rate limiting', async () => {});
    it('should persist logs', async () => {});
  });
});
```

---

### 🟡 ФАЗА 5: ИНТЕГРАЦИОННЫЕ ТЕСТЫ (Приоритет MEDIUM)

**`tests/integration/video-workflow.test.ts`** 🟡 MEDIUM

```typescript
describe('Video Workflow Integration', () => {
  it('should complete full workflow: channel -> playlist -> videos -> rating', async () => {});
  it('should filter + sort + paginate videos', async () => {});
  it('should cache data at all levels', async () => {});
  it('should handle errors at each step', async () => {});
});
```

---

**`tests/integration/channel-management.test.ts`** 🟡 MEDIUM

```typescript
describe('Channel Management Integration', () => {
  it('should add channel through UI', async () => {});
  it('should load channel playlists', async () => {});
  it('should import playlists', async () => {});
  it('should delete channel', async () => {});
  it('should persist to localStorage', async () => {});
});
```

---

**`tests/integration/kinorate-workflow.test.ts`** 🟡 MEDIUM

```typescript
describe('KinoRate AI Workflow', () => {
  it('should search movie through AI', async () => {});
  it('should display KP/IMDB ratings', async () => {});
  it('should process batch requests', async () => {});
  it('should fallback between providers', async () => {});
  it('should cache results', async () => {});
});
```

---

**`tests/integration/user-preferences.test.ts`** 🟡 MEDIUM

```typescript
describe('User Preferences Integration', () => {
  it('should save grid settings', async () => {});
  it('should save formula settings', async () => {});
  it('should save history', async () => {});
  it('should sync across tabs', async () => {});
});
```

---

### 🟢 ФАЗА 6: E2E ТЕСТЫ (Приоритет LOW)

**Рекомендация:** Добавить Playwright для E2E тестирования

**Установка:**

```bash
npm install -D @playwright/test
npx playwright install
```

**`tests/e2e/homepage.spec.ts`** 🟢 LOW

```typescript
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load recommended channels', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="recommended-channels"]')).toBeVisible();
  });

  test('should add a channel', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="add-channel-button"]');
    await page.fill('[data-testid="channel-url-input"]', 'https://rutube.ru/channel/123/');
    await page.click('[data-testid="add-channel-submit"]');
    await expect(page.locator('[data-testid="channel-list"]')).toContainText('New Channel');
  });
});
```

---

**`tests/e2e/video-browsing.spec.ts`** 🟢 LOW

```typescript
test.describe('Video Browsing', () => {
  test('should browse videos in channel', async ({ page }) => {
    await page.goto('/');
    // Открыть канал
    await page.click('[data-testid="channel-1"]');
    // Выбрать плейлист
    await page.click('[data-testid="playlist-1"]');
    // Применить фильтр
    await page.click('[data-testid="filter-rating"]');
    // Проверить видео
    await expect(page.locator('[data-testid="video-card"]').first()).toBeVisible();
  });

  test('should open video modal', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="channel-1"]');
    await page.click('[data-testid="video-card"]').first();
    await expect(page.locator('[data-testid="video-modal"]')).toBeVisible();
  });
});
```

---

**`tests/e2e/kinorate-search.spec.ts`** 🟢 LOW

```typescript
test.describe('KinoRate Search', () => {
  test('should search movie ratings', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="channel-1"]');
    await page.click('[data-testid="video-card"]').first();
    await page.click('[data-testid="kinorate-button"]');
    await expect(page.locator('[data-testid="kp-rating"]')).toBeVisible();
    await expect(page.locator('[data-testid="imdb-rating"]')).toBeVisible();
  });
});
```

---

## 🛠️ ИНСТРУМЕНТЫ И НАСТРОЙКИ

### Текущий стек тестирования

#### Frontend

- ✅ **Vitest** - unit/integration тесты
- ✅ **React Testing Library** - тестирование компонентов
- ✅ **@testing-library/user-event** - симуляция взаимодействий
- ✅ **@testing-library/jest-dom** - дополнительные матчеры
- ✅ **happy-dom / jsdom** - DOM окружение
- ✅ **@vitest/coverage-v8** - покрытие кода

#### Backend

- ✅ **Node.js test runner** - встроенный test runner
- ✅ **Supertest** - тестирование HTTP endpoints

#### Рекомендуется добавить

- 📦 **Playwright** - E2E тестирование
- 📦 **MSW (Mock Service Worker)** - мокирование API на уровне сети
- 📦 **Faker.js** - генерация тестовых данных

---

### Конфигурация Vitest

**`vitest.config.ts`** (уже настроен):

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/frontend/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/index.tsx', 'src/**/*.d.ts'],
      // Рекомендуемые пороги покрытия
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

---

### Структура тестовых файлов

```
tests/
├── setup.ts                          # Глобальная настройка тестов
├── frontend/                         # Frontend тесты (Vitest)
│   ├── hooks/
│   │   ├── useAppLogic.test.ts
│   │   ├── useChannels.test.ts
│   │   ├── useVideoLogic.test.ts
│   │   └── ...
│   ├── components/
│   │   ├── VideoCard.test.tsx        ✅ Существует
│   │   ├── Navigation.test.tsx
│   │   ├── MainContent.test.tsx
│   │   └── ...
│   ├── services/
│   │   ├── rutubeService.test.ts
│   │   ├── llmService.test.ts
│   │   ├── storageService.test.ts    ✅ Существует
│   │   └── loggerService.test.ts     ✅ Существует
│   └── utils/
│       └── ...
├── backend/                          # Backend тесты (Node.js)
│   ├── proxy-router.test.js          ✅ Существует
│   ├── ai-router.test.js
│   ├── security-middleware.test.js   ✅ Существует
│   └── ...
├── integration/                      # Интеграционные тесты
│   ├── video-workflow.test.ts
│   ├── channel-management.test.ts
│   └── ...
└── e2e/                             # E2E тесты (Playwright)
    ├── homepage.spec.ts
    ├── video-browsing.spec.ts
    └── ...
```

---

## 📊 МЕТРИКИ ПОКРЫТИЯ

### Целевые показатели

| Тип кода          | Текущее | Цель | Приоритет |
| ----------------- | ------- | ---- | --------- |
| **Services**      | 40%     | 90%  | 🔴 HIGH   |
| **Hooks**         | 33%     | 85%  | 🔴 HIGH   |
| **Components**    | 5.5%    | 75%  | 🟡 MEDIUM |
| **Utils**         | 0%      | 90%  | 🟡 MEDIUM |
| **Server Routes** | 60%     | 85%  | 🔴 HIGH   |
| **Overall**       | ~30%    | 80%  | 🔴 HIGH   |

### Критерии качества тестов

✅ **Полнота:**

- Все публичные API функции покрыты
- Все пользовательские сценарии покрыты
- Все граничные случаи покрыты

✅ **Изоляция:**

- Тесты не зависят друг от друга
- Каждый тест можно запустить отдельно
- Моки очищаются между тестами

✅ **Скорость:**

- Unit тесты < 100ms каждый
- Integration тесты < 1s каждый
- E2E тесты < 10s каждый

✅ **Читаемость:**

- Понятные названия тестов (describe/it)
- AAA паттерн (Arrange, Act, Assert)
- Минимальная сложность

---

## 🚀 ПЛАН ВНЕДРЕНИЯ

### Этап 1: Исправление существующих тестов (Неделя 1)

**Приоритет: 🔴 КРИТИЧНО**

1. ✅ Исправить 6 failing тестов:
   - `loggerService.test.ts` (2 теста)
   - `VideoCard.test.tsx` (4 теста)

2. ✅ Провести ревью существующих тестов
3. ✅ Обновить setup.ts при необходимости

**Результат:** Все существующие тесты зеленые

---

### Этап 2: Критичные Services (Неделя 2-3)

**Приоритет: 🔴 HIGH**

1. ✅ `rutubeService.test.ts` - самый критичный (1123 строки!)
   - fetchVideos
   - fetchChannelInfo
   - fetchAllVideos
   - calculateVideoRating
   - parseChannelIdFromUrl
   - searchChannelByName
   - fetchRecommendedChannels

2. ✅ `llmService.test.ts`
   - searchMovieRatings
   - analyzeBatchWithAgent

**Результат:** Services покрытие > 85%

---

### Этап 3: Core Hooks (Неделя 4-5)

**Приоритет: 🔴 HIGH**

1. ✅ `useAppLogic.test.ts`
2. ✅ `useChannels.test.ts`
3. ✅ `useVideoLogic.test.ts`
4. ✅ `useModals.test.ts`
5. ✅ `useVideoStatuses.test.ts`
6. ✅ `useHistory.test.ts`
7. ✅ `useSortingAndGrid.test.ts`

**Результат:** Core Hooks покрытие > 85%

---

### Этап 4: UI Components - Модальные окна (Неделя 6-7)

**Приоритет: 🟡 MEDIUM**

1. ✅ `VideoModal.test.tsx`
2. ✅ `KinoRateModal.test.tsx`
3. ✅ `AddChannelModal.test.tsx`
4. ✅ `AddCategoryModal.test.tsx`
5. ✅ `FormulaSettingsModal.test.tsx`
6. ✅ `HistoryModal.test.tsx`
7. ✅ `ImportPlaylistsModal.test.tsx`
8. ✅ `ConfirmModal.test.tsx`
9. ✅ `NotificationModal.test.tsx`

**Результат:** Модальные окна покрытие > 75%

---

### Этап 5: UI Components - Основные компоненты (Неделя 8-9)

**Приоритет: 🟡 MEDIUM**

1. ✅ `Navigation.test.tsx`
2. ✅ `MainContent.test.tsx`
3. ✅ `ChannelHeader.test.tsx`
4. ✅ `CategoryFilter.test.tsx`
5. ✅ `Pagination.test.tsx`
6. ✅ `RecommendedChannelCard.test.tsx`
7. ✅ `RatingChart.test.tsx`
8. ✅ `UIComponents.test.tsx`

**Результат:** Компоненты покрытие > 70%

---

### Этап 6: Server Routes (Неделя 10)

**Приоритет: 🔴 HIGH**

1. ✅ Дополнить `ai-router.test.js`
2. ✅ Создать `health-router.test.js`
3. ✅ Создать `logs-router.test.js`

**Результат:** Server Routes покрытие > 85%

---

### Этап 7: Integration Tests (Неделя 11-12)

**Приоритет: 🟡 MEDIUM**

1. ✅ `video-workflow.test.ts`
2. ✅ `channel-management.test.ts`
3. ✅ `kinorate-workflow.test.ts`
4. ✅ `user-preferences.test.ts`

**Результат:** Критичные workflow покрыты

---

### Этап 8: Вспомогательные Hooks (Неделя 13)

**Приоритет: 🟢 LOW**

1. ✅ Остальные hooks из src/hooks/

**Результат:** Hooks покрытие > 80%

---

### Этап 9: E2E Tests (Неделя 14-15)

**Приоритет: 🟢 LOW**

1. ✅ Настроить Playwright
2. ✅ Создать базовые E2E тесты
3. ✅ Интегрировать в CI/CD

**Результат:** Критичные user flows покрыты E2E

---

## 🔄 CI/CD ИНТЕГРАЦИЯ

### GitHub Actions Workflow

**`.github/workflows/ci.yml`** (обновить):

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # Unit & Integration Tests
      - name: Install dependencies
        run: npm ci

      - name: Run frontend tests
        run: npx vitest run --coverage

      - name: Run backend tests
        run: npm run test:api

      # Upload coverage
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json

      # E2E Tests (после добавления Playwright)
      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload E2E results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
```

---

## 📋 CHECKLIST ДЛЯ КАЖДОГО ТЕСТА

При написании теста убедитесь:

- [ ] ✅ Тест изолирован (не зависит от других тестов)
- [ ] ✅ Используются моки для внешних зависимостей
- [ ] ✅ Cleanup выполняется (beforeEach/afterEach)
- [ ] ✅ Тестируются граничные случаи
- [ ] ✅ Тестируются ошибки
- [ ] ✅ Название теста понятно описывает сценарий
- [ ] ✅ Используется AAA паттерн
- [ ] ✅ Нет магических чисел (используются константы)
- [ ] ✅ Тест проходит при запуске отдельно
- [ ] ✅ Тест проходит при запуске со всеми тестами

---

## 🎯 BEST PRACTICES

### 1. Naming Convention

```typescript
// ❌ Плохо
it('test 1', () => {});

// ✅ Хорошо
it('should load videos when channel is selected', () => {});
```

### 2. AAA Pattern

```typescript
it('should add channel to list', () => {
  // Arrange
  const mockChannel = { id: '1', label: 'Test', rutubeId: '123' };

  // Act
  const result = addChannel(mockChannel);

  // Assert
  expect(result).toContain(mockChannel);
});
```

### 3. Изоляция тестов

```typescript
describe('useChannels', () => {
  beforeEach(() => {
    // Очистка перед каждым тестом
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup после теста
    vi.restoreAllMocks();
  });
});
```

### 4. Моки

```typescript
// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ results: [] }),
  })
);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

### 5. Async тесты

```typescript
it('should fetch videos', async () => {
  const promise = fetchVideos('channel-123');

  // Дождаться завершения
  const result = await promise;

  expect(result).toBeDefined();
  expect(result.videos).toHaveLength(10);
});
```

### 6. User interactions

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should open modal on button click', async () => {
  const user = userEvent.setup();
  render(<Component />);

  const button = screen.getByRole('button', { name: /open/i });
  await user.click(button);

  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

### Документация

- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev/)
- [Supertest](https://github.com/ladjs/supertest)

### Руководства

- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Vitest Coverage](https://vitest.dev/guide/coverage.html)
- [E2E Testing Best Practices](https://playwright.dev/docs/best-practices)

---

## 📈 МОНИТОРИНГ ПРОГРЕССА

### Команды для проверки покрытия

```bash
# Frontend тесты с покрытием
npx vitest run --coverage

# Backend тесты
npm run test:api

# Все тесты
npm test

# Watch mode (разработка)
npx vitest

# Specific test file
npx vitest tests/frontend/useChannels.test.ts
```

### Coverage Report

После запуска тестов с coverage:

- HTML отчет: `coverage/index.html`
- JSON: `coverage/coverage-final.json`
- Text: выводится в терминал

---

## ✅ КРИТЕРИИ УСПЕХА

### Минимальные требования (MVP)

- ✅ Все существующие тесты проходят
- ✅ Services покрытие > 85%
- ✅ Core Hooks покрытие > 85%
- ✅ Server Routes покрытие > 85%
- ✅ Общее покрытие > 70%

### Желаемые требования

- ✅ Компоненты покрытие > 75%
- ✅ Все Hooks покрытие > 80%
- ✅ Integration тесты покрывают критичные workflow
- ✅ Общее покрытие > 80%

### Идеальное состояние

- ✅ Все модули покрытие > 85%
- ✅ E2E тесты для всех пользовательских сценариев
- ✅ Автоматический запуск в CI/CD
- ✅ Coverage badge в README
- ✅ Общее покрытие > 90%

---

## 🎓 ЗАКЛЮЧЕНИЕ

Этот план обеспечивает:

1. **Раннее обнаружение ошибок** - тесты ловят баги до production
2. **Уверенность в рефакторинге** - можно безопасно менять код
3. **Документация через тесты** - тесты показывают как использовать код
4. **Высокое качество кода** - покрытие тестами заставляет писать тестируемый код
5. **Быструю разработку** - меньше времени на ручное тестирование

**Приоритеты:**

1. 🔴 **HIGH** - Services, Core Hooks, Server Routes (Недели 1-6)
2. 🟡 **MEDIUM** - UI Components, Integration Tests (Недели 7-12)
3. 🟢 **LOW** - Вспомогательные Hooks, E2E Tests (Недели 13-15)

**Следующие шаги:**

1. Исправить failing тесты
2. Начать с `rutubeService.test.ts`
3. Постепенно покрывать по плану

Удачи в тестировании! 🚀

---

## 📊 Актуальный статус тестирования (2026-02-17)

### ✅ Этап 5 завершён

**Общие метрики:**

- **Всего тестов:** 522 (401 frontend + 121 backend)
- **Прохождение:** 100% (522/522)
- **Покрытие:** 49.23% lines, 57.87% functions, 36.28% branches
- **Тестовых файлов:** 30 (22 frontend + 8 backend)
- **Время выполнения:** ~40s локально

### Новые тесты (Этап 5)

**Frontend (Vitest):**

1. `tests/frontend/useVideoLogic.test.ts` - 17 тестов
   - Загрузка видео
   - Кэширование
   - Обработка ошибок
   - AbortController cleanup

2. `tests/frontend/storageServiceAsync.test.ts` - 18 тестов
   - IndexedDB операции
   - Миграция из localStorage
   - TTL и автоочистка
   - Graceful degradation

**Backend (Node.js test runner):** 3. `tests/backend/jsonParser.test.js` - 46 тестов

- Парсинг корректного JSON
- Broken JSON recovery
- Markdown-wrapped JSON
- Edge cases

4. `tests/backend/ai-router.test.js` - 10 тестов
   - POST /api/ai/search-movie-ratings
   - POST /api/ai/analyze-batch
   - Валидация входных данных
   - Error handling

**E2E (Playwright config):** 5. `tests/e2e/homepage.spec.ts` - 8 сценариев

- Homepage loads
- Navigation works
- Search filters
- Video cards display
- Pagination
- Channel switching
- Modal opening

### CI/CD Pipeline

**GitHub Actions (5 jobs):**

```
lint-typecheck → [test-frontend ‖ test-backend] → build → smoke-test
```

1. **lint-typecheck** - ESLint + TypeScript
2. **test-frontend** - 401 тест + coverage артефакт
3. **test-backend** - 121 тест
4. **build** - Vite production build + dist артефакт
5. **smoke-test** - Health check + файлы проверка

**Артефакты:**

- `frontend-coverage/` (retention 7 дней)
- `dist/` (retention 7 дней)

### Покрытие по категориям

**Hooks (высокое покрытие):**

- useFilters: 96.42%
- useGridClass: 100%
- useHistory: 100%
- useModals: 100%
- usePagination: 100%
- useSortingAndGrid: 100%
- useVideoCache: 100%
- useVideoStatuses: 100%

**Services (хорошее покрытие):**

- llmService: 83.87%
- loggerService: 82.5%
- CircuitBreaker: 96.42%

**Требует внимания (низкое покрытие):**

- useAppComposition: 0% (сложная интеграция)
- App.tsx: 0% (минималистичный wrapper)
- abortUtils: 0% (простые утилиты)

### Следующие шаги

**Этап 6 (Observability):**

- [ ] Correlation ID тесты
- [ ] Structured logging тесты
- [ ] Метрики тесты

**Опциональные улучшения:**

- [ ] Установить Playwright: `npm install -D @playwright/test`
- [ ] Запустить E2E: `npx playwright test`
- [ ] Увеличить покрытие до 60%+
- [ ] Добавить тесты для useAppComposition

### Команды

```bash
# Все тесты
npm test

# Frontend с coverage
npm run test:frontend:coverage

# Backend
npm run test:api

# E2E (требует установки)
npx playwright install
npx playwright test

# CI локально (требует act)
act -j lint-typecheck
```

### Документация

- **Детальный отчёт:** [docs/TESTING_REPORT_STAGE5.md](TESTING_REPORT_STAGE5.md)
- **Архитектура:** [docs/ARCHITECTURE.md](ARCHITECTURE.md#cicd-и-тестирование)
- **План развития:** [docs/CODE_REVIEW.md](CODE_REVIEW.md)

---

**Статус:** ✅ Стратегия тестирования реализована и работает в production.
