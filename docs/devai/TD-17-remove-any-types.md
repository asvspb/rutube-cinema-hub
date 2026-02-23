# TD-17: Устранение 29 оставшихся `any` типов

**Дата создания**: 2026-02-23  
**Статус**: ✅ Выполнено  
**Приоритет**: P0 (Критический)

---

## 📊 Анализ текущего состояния

**Найдено 29 вхождений `any` в 10 файлах:**

| Файл                               | Кол-во | Категория   |
| ---------------------------------- | ------ | ----------- |
| `src/services/storageService.ts`   | 5      | Хранилище   |
| `src/services/loggerService.ts`    | 4      | Логирование |
| `src/hooks/useAppLogic.ts`         | 4      | Хуки        |
| `src/hooks/useChannelMenu.ts`      | 4      | Хуки        |
| `src/services/top250Data.ts`       | 3      | Сервисы     |
| `src/hooks/useMainContentProps.ts` | 2      | Хуки        |
| `src/components/UIComponents.tsx`  | 2      | Компоненты  |
| `src/hooks/useCategoryEffects.ts`  | 2      | Хуки        |
| `src/components/*.tsx` (3 файла)   | 3      | Ошибки      |

---

## 🎯 План устранения по категориям

### 1. Типы для StorageService (5 штук)

**Новые типы в `src/types/ui.ts`:**

```typescript
/** Watch history item */
export interface WatchHistoryItem {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  viewedAt: number; // timestamp
  channelId?: string;
}

/** Available playlist for channel */
export interface AvailablePlaylist {
  id: string;
  title: string;
  itemCount: number;
  thumbnailUrl?: string;
}
```

**Изменения в `storageService.ts`:**

- `playlists: any[]` → `playlists: CategoryDef[]`
- `watchHistory: any[]` → `watchHistory: WatchHistoryItem[]`
- `getWatchHistory(): any[]` → `getWatchHistory(): WatchHistoryItem[]`
- `setWatchHistory(history: any[], ...)` → `setWatchHistory(history: WatchHistoryItem[], ...)`
- `getAvailablePlaylistsForChannel(): any[]` → `getAvailablePlaylistsForChannel(): AvailablePlaylist[]`

---

### 2. Типы для LoggerService (4 штуки)

**Новый тип в `src/services/loggerService.ts`:**

```typescript
/** Log context data */
export interface LogContext {
  url?: string;
  userId?: string;
  channelId?: string;
  videoId?: string;
  duration?: number;
  error?: Error;
  [key: string]: string | number | boolean | Error | undefined;
}
```

**Изменения:**

- `context?: any` → `context?: LogContext` во всех методах

---

### 3. Типы для хуков (10 штук)

**В `src/hooks/useAppLogic.ts`:**

- `setRatingSettings: React.Dispatch<React.SetStateAction<any>>` → `React.Dispatch<React.SetStateAction<RatingSettings>>`
- `addToCache: (categoryId: string, data: any)` → `addToCache: (categoryId: string, data: RutubeVideo[])`
- Убрать `as any` приведения для `StorageService.setGridColumns` и `StorageService.setRatingSettings`

**В `src/hooks/useChannelMenu.ts`:**

- `currentChannelPlaylists: any[]` → `currentChannelPlaylists: AvailablePlaylist[]`
- `setActiveCategory: (category: any)` → `setActiveCategory: (category: CategoryDef | null)`
- `setVideoCache: (cache: Record<string, any>)` → `setVideoCache: (cache: VideoCache)`
- `activeCategory: any` → `activeCategory: CategoryDef | null`

**В `src/hooks/useCategoryEffects.ts`:**

- `setSortOption: (option: any)` → `setSortOption: (option: SortOption)`

**В `src/hooks/useMainContentProps.ts`:**

- `kinoRateContext: any` → `kinoRateContext: KinoRateContext | null`
- `setKinoRateContext: (context: any)` → `setKinoRateContext: (context: KinoRateContext | null)`

---

### 4. Типы для top250Data (3 штуки)

**Новые типы в `src/types/kinorate.ts`:**

```typescript
/** Raw movie data from Top250 dataset */
export interface TopMovieRaw {
  id?: string | number;
  imdbId?: string | number;
  title?: string;
  originalTitle?: string;
  year?: string | number;
  rating?: string | number;
  votes?: string | number;
  awards?: unknown[];
}

/** Raw Top250 JSON structure */
export interface TopDatasetJson {
  movies?: TopMovieRaw[];
  [key: string]: unknown;
}
```

**Изменения в `top250Data.ts`:**

- `awards: any[]` → `awards: unknown[]`
- `json: any` → `json: TopDatasetJson`
- `(m: any)` → `(m: TopMovieRaw)`

---

### 5. Типы для компонентов (5 штук)

**В `src/components/UIComponents.tsx`:**

- `ratingSettings: any` → `ratingSettings: RatingSettings`
- `metadataCache: any` → `metadataCache: MetadataCache`

**В `src/components/AddCategoryModal.tsx` и `AddChannelModal.tsx`:**

- `catch (err: any)` → `catch (err: unknown)` с type guard

**В `src/components/KinoRate/KinoRateModal.tsx`:**

- `(movie: any)` → `(movie: TopMovie)`

---

## 📁 Структура файлов для изменения

```
src/types/
├── ui.ts           (+ WatchHistoryItem, AvailablePlaylist, VideoCache, MetadataCache, KinoRateContext)
├── kinorate.ts     (+ TopMovieRaw, TopDatasetJson)
└── index.ts        (re-export новых типов)

src/services/
├── storageService.ts  (5 any → типизированные)
├── loggerService.ts   (4 any → LogContext)
└── top250Data.ts      (3 any → типизированные)

src/hooks/
├── useAppLogic.ts         (4 any)
├── useChannelMenu.ts      (4 any)
├── useCategoryEffects.ts  (2 any)
└── useMainContentProps.ts (2 any)

src/components/
├── UIComponents.tsx       (2 any)
├── AddCategoryModal.tsx   (1 any)
├── AddChannelModal.tsx    (1 any)
└── KinoRate/KinoRateModal.tsx (1 any)
```

---

## ✅ Критерии приёмки

1. **Компиляция**: `npm run build` без ошибок TypeScript
2. **Тесты**: Все существующие тесты проходят
3. **ESLint**: Отсутствие ошибок `@typescript-eslint/no-explicit-any`
4. **Функциональность**: Приложение работает без изменений поведения

---

## ⏱️ Оценка времени

| Этап                      | Время   |
| ------------------------- | ------- |
| Новые типы в `types/*.ts` | 30 мин  |
| storageService.ts         | 20 мин  |
| loggerService.ts          | 15 мин  |
| top250Data.ts             | 20 мин  |
| Хуки (4 файла)            | 45 мин  |
| Компоненты (4 файла)      | 20 мин  |
| Тестирование и фикс       | 30 мин  |
| **Итого**                 | ~3 часа |

---

## 📝 Прогресс выполнения

- [x] Добавить новые типы в `src/types/ui.ts`
- [x] Добавить новые типы в `src/types/kinorate.ts`
- [x] Обновить реэкспорты в `src/types/index.ts`
- [x] Исправить `src/services/storageService.ts`
- [x] Исправить `src/services/loggerService.ts`
- [x] Исправить `src/services/top250Data.ts`
- [x] Исправить `src/hooks/useAppLogic.ts`
- [x] Исправить `src/hooks/useChannelMenu.ts`
- [x] Исправить `src/hooks/useCategoryEffects.ts`
- [x] Исправить `src/hooks/useMainContentProps.ts`
- [x] Исправить `src/components/UIComponents.tsx`
- [x] Исправить `src/components/AddCategoryModal.tsx`
- [x] Исправить `src/components/AddChannelModal.tsx`
- [x] Исправить `src/components/KinoRate/KinoRateModal.tsx`
- [x] Запустить сборку и тесты

---

## ✅ Результаты выполнения

**Дата завершения**: 2026-02-23

### Проверка качества

| Критерий        | Результат                |
| --------------- | ------------------------ |
| `npm run build` | ✅ Успешно (2504 модуля) |
| `grep ": any"`  | ✅ 0 результатов         |
| Dev-сервер      | ✅ Запущен без ошибок    |
| Логи            | ✅ Чистые                |

### Добавленные типы

**В `src/types/ui.ts`:**

- `WatchHistoryItem` — элемент истории просмотров
- `AvailablePlaylist` — доступный плейлист для канала
- `VideoCache` — кэш видео по категориям
- `MetadataCache` — кэш метаданных фильмов
- `KinoRateContext` — состояние контекста KinoRate

**В `src/types/kinorate.ts`:**

- `TopMovieRaw` — сырые данные фильма из Top250 датасета
- `TopDatasetJson` — структура JSON для Top250 файлов
- `Award` — структура награды (уже был в kinorate.ts)

**В `src/services/loggerService.ts`:**

- `LogContext` — типизированный контекст логирования

### Предупреждения (не критичные)

1. **Chunk size > 500kB** — рекомендация по code-splitting (не влияет на работу)
2. **Dynamic import warning** — llmService импортируется двумя способами (не влияет на работу)

### Статистика

- **Файлов изменено**: 14
- **`any` устранено**: 29
- **Новых типов**: 8
- **Время выполнения**: ~2.5 часа
