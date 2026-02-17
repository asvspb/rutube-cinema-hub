# Система типов Rutube Cinema Hub

> Документация модульной архитектуры типов и runtime валидации

**Дата:** 2026-02-17  
**Статус:** ✅ Актуально (Этап 3 завершён)

---

## 📋 Обзор

Проект использует **модульную систему типов** с разделением по доменам и **runtime валидацией** всех внешних данных через Zod. Это обеспечивает:

- ✅ **Безопасность типов** - 0 использований `any` в критичных сервисах
- ✅ **Runtime защита** - валидация данных от Rutube API и LLM провайдеров
- ✅ **Масштабируемость** - чёткое разделение ответственности
- ✅ **Поддерживаемость** - изолированные модули типов

---

## 📂 Структура файлов

```
src/types/
├── index.ts (148 строк)      # Точка входа, реэкспорты всех типов
├── rutube.ts (159 строк)     # Rutube API типы и внутренние структуры
├── kinorate.ts (57 строк)    # AI/LLM рейтинги и батч-обработка
├── ui.ts (80 строк)          # UI компоненты, фильтры, сортировка
└── schemas.ts (185 строк)    # Zod схемы и функции валидации
```

**Итого:** 540 строк строго типизированного кода

---

## 🗂️ Модули типов

### 1. `types/index.ts` - Точка входа

**Назначение:** Центральная точка экспорта всех типов проекта.

**Экспортируемые категории:**

- Rutube API types (18 типов)
- KinoRate types (5 типов)
- UI types (7 типов)
- Zod schemas (8 схем)
- Validation helpers (6 функций)

**Использование:**

```typescript
import { RutubeVideo, MovieRatingData, validateVideoItems } from '../types';
```

---

### 2. `types/rutube.ts` - Rutube API типы

**Назначение:** Типы для работы с Rutube API и внутреннего представления данных.

#### Raw API Response Types (от Rutube API)

```typescript
// Сырое видео от API
interface RutubeApiVideoItem {
  id: string | number;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  picture_url?: string;
  duration?: number;
  views?: number;
  hits?: number;
  created_ts?: string;
  video_url?: string;
  html?: string;
}

// Пагинированный ответ API
interface RutubeApiResponseRaw {
  results?: RutubeApiVideoItem[] | { [key: string]: unknown };
  has_next?: boolean | 0 | 1;
  next?: string | null;
}

// Элемент плейлиста
interface RutubeApiPlaylistItem {
  id: string | number;
  title?: string;
  name?: string;
  video_count?: number;
  videos_count?: number;
  count?: number;
}
```

#### Internal Types (внутреннее использование)

```typescript
// Обработанное видео для UI
interface RutubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  duration: number;
  views: number;
  created_ts: string;
  video_url: string;
  html: string;
  rating: number; // Вычисляемый рейтинг
  gravity: number; // Гравитационный рейтинг
}

// Обёртка ответа с обработанными видео
interface RutubeApiResponse {
  results: RutubeVideo[];
  has_next: boolean;
  next: string | null;
}

// Информация о канале для UI
interface ChannelInfo {
  title: string;
  subscribers: string;
  avatarUrl: string;
  bannerUrl: string;
  videoCount?: number;
}
```

#### Redux State Types (для HTML парсинга)

```typescript
// Redux состояние из HTML страниц Rutube
interface RutubeReduxState {
  userChannel?: {
    /* ... */
  };
  channel?: {
    /* ... */
  };
  profile?: {
    /* ... */
  };
  currentChannel?: { id?: string | number };
  feed?: { results?: RutubeApiVideoItem[] };
  videos?: { results?: RutubeApiVideoItem[] };
  playlists?: { results?: RutubeApiPlaylistItem[] };
}
```

---

### 3. `types/kinorate.ts` - AI/LLM рейтинги

**Назначение:** Типы для работы с AI-обогащёнными данными о фильмах.

```typescript
// Рейтинговые данные от AI
interface MovieRatingData {
  title: string;
  originalTitle: string;
  year: string;
  kpRating: number; // Кинопоиск
  kpVotes: string;
  imdbRating: number; // IMDb
  imdbUrl?: string;
  description: string;
  sources?: string[]; // Источники данных
  awards?: string[]; // Награды
  dataSource?: 'local' | 'ai';
  aiAttempts?: number;
}

// Элемент батч-обработки
interface BatchItem {
  id: string;
  query: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: MovieRatingData;
}

// Ответ AI на одиночный запрос
interface AiKinorateSearchResponse {
  success: boolean;
  data?: MovieRatingData;
  error?: string;
}

// Ответ AI на батч-запрос
interface AiKinorateBatchResponse {
  success: boolean;
  data?: MovieRatingData[];
  error?: string;
}
```

---

### 4. `types/ui.ts` - UI типы

**Назначение:** Типы для UI компонентов, фильтров, сортировки.

```typescript
// Определение категории/плейлиста
interface CategoryDef {
  id: string;
  label: string;
  rutubeId: string;
  type: 'channel' | 'playlist';
  isSystem?: boolean;
  itemCount?: number;
}

// Опции сортировки
type SortOption =
  | 'date'
  | 'rating'
  | 'alphabetical'
  | 'year'
  | 'watched'
  | 'liked'
  | 'watch_later'
  | 'views'
  | 'trend'
  | 'default';

// Настройки формул рейтинга
interface RatingSettings {
  ratingBase: number;
  ratingLogScale: number;
  gravityHourOffset: number;
  gravityPower: number;
  useExperimentalStrategy: boolean;
  thresholdLow: number;
  thresholdHigh: number;
  // ... дополнительные поля
}

// Статусы видео
type VideoWatchedStatus = 'watched' | 'watch_later';
type VideoLikedStatus = 'liked' | 'disliked';
type VideoWatchedStatusMap = Record<string, VideoWatchedStatus>;
type VideoLikedStatusMap = Record<string, VideoLikedStatus>;
```

---

### 5. `types/schemas.ts` - Zod схемы и валидация

**Назначение:** Runtime валидация всех внешних данных.

#### Zod Схемы

```typescript
// Rutube API
const RutubeApiVideoItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().optional(),
  // ... 11 дополнительных полей
});

const RutubeApiResponseRawSchema = z.object({
  results: z
    .union([z.array(RutubeApiVideoItemSchema), z.record(z.string(), z.unknown())])
    .optional()
    .nullable(),
  has_next: z.union([z.boolean(), z.literal(0), z.literal(1)]).optional(),
  next: z.string().nullable().optional(),
});

// AI/LLM
const MovieRatingDataSchema = z.object({
  title: z.string(),
  originalTitle: z.string(),
  year: z.string(),
  kpRating: z.number(),
  imdbRating: z.number(),
  description: z.string(),
  // ... дополнительные опциональные поля
});
```

#### Функции валидации

```typescript
// Безопасный парсинг JSON
function safeParseJson(text: string): unknown;

// Парсинг прокси-ответов с обработкой обёрток
function parseProxyResponse(text: string): unknown;

// Валидация массива видео с фильтрацией
function validateVideoItems(data: unknown): RutubeApiVideoItem[];

// Валидация одного рейтинга
function validateMovieRatingData(data: unknown): MovieRatingData | null;

// Валидация массива рейтингов с автофильтрацией null
function validateMovieRatingArray(data: unknown): MovieRatingData[];

// Извлечение URL пагинации
function extractNextUrl(data: unknown): string | null;
```

---

## 🛡️ Runtime валидация

### Точки интеграции

#### 1. `rutubeService.ts` (4 использования)

```typescript
import { parseProxyResponse, extractNextUrl } from '../types';

// Парсинг ответа API
const data = parseProxyResponse(responseText);

// Извлечение URL следующей страницы
const nextUrl = extractNextUrl(data);
```

#### 2. `llmService.ts` (4 использования)

```typescript
import { validateMovieRatingData, validateMovieRatingArray } from '../types';

// Валидация одиночного ответа
const validatedData = validateMovieRatingData(response);

// Валидация батч-ответа
const validatedArray = validateMovieRatingArray(batchResponse);
```

### Преимущества валидации

1. **Защита от некорректных данных:**
   - Невалидные ответы API отфильтровываются
   - Неожиданные форматы не попадают в приложение

2. **Безопасность типов:**
   - TypeScript типы + Zod схемы = двойная защита
   - Compile-time + runtime проверки

3. **Автоматическая фильтрация:**
   - `validateMovieRatingArray()` убирает `null` значения
   - `validateVideoItems()` оставляет только корректные элементы

---

## 🔧 TypeScript конфигурация

```json
{
  "compilerOptions": {
    "strict": true, // Все строгие проверки
    "noFallthroughCasesInSwitch": true, // Защита switch
    "noImplicitAny": true, // Запрет неявного any
    "strictNullChecks": true, // Строгие null проверки
    "strictFunctionTypes": true, // Строгие типы функций
    "strictPropertyInitialization": true // Инициализация свойств
  }
}
```

**Результат:** Компиляция без ошибок и предупреждений в strict mode.

---

## 📊 Метрики

| Метрика                    | Значение       |
| -------------------------- | -------------- |
| Модулей типов              | 5              |
| Строк кода типов           | 540            |
| Использований `any`        | 0              |
| Zod схем                   | 8              |
| Функций валидации          | 6              |
| Точек интеграции валидации | 8              |
| Покрытие тестами           | 365/365 (100%) |

---

## 🎯 Лучшие практики

### 1. Разделение Raw и Internal типов

```typescript
// ❌ Плохо: смешивание API и внутренних типов
interface Video {
  id: string | number; // от API
  rating: number; // вычисляемое
}

// ✅ Хорошо: разделение
interface RutubeApiVideoItem {
  id: string | number;
}

interface RutubeVideo {
  id: string;
  rating: number;
}
```

### 2. Валидация перед использованием

```typescript
// ❌ Плохо: прямое использование
const videos = JSON.parse(response).results;

// ✅ Хорошо: валидация
const data = parseProxyResponse(response);
const videos = validateVideoItems(data);
```

### 3. Центральная точка экспорта

```typescript
// ❌ Плохо: прямые импорты
import { RutubeVideo } from '../types/rutube';
import { MovieRatingData } from '../types/kinorate';

// ✅ Хорошо: через index
import { RutubeVideo, MovieRatingData } from '../types';
```

---

## 🔮 Планы развития

### Краткосрочные (Этап 4-5)

- [ ] Добавить JSDoc комментарии к схемам
- [ ] Создать utility types (`Nullable<T>`, `WithId<T>`)
- [ ] Документировать примеры использования в schemas.ts

### Долгосрочные

- [ ] Branded types для ID (`RutubeVideoId`, `ChannelId`)
- [ ] Discriminated unions для состояний загрузки
- [ ] Генерация OpenAPI схем из Zod

---

## 📚 Связанные документы

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Общая архитектура проекта
- [CODE_REVIEW.md](./CODE_REVIEW.md) - Код-ревью и план развития
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Стратегия тестирования

---

**Последнее обновление:** 2026-02-17  
**Автор:** Rutube Cinema Hub Team
