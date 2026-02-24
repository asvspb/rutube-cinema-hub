# План: Расширенные фильтры ленты

## Обзор задачи

Добавить расширенные настройки фильтрации видео в ленту Kino Club.

### Требуемые функции:

| #   | Функция                                      | Приоритет | Сложность     |
| --- | -------------------------------------------- | --------- | ------------- |
| 1   | Выбор максимального размера ленты (20...100) | Высокий   | Низкая        |
| 2   | Фильтр выбора плейлистов                     | Высокий   | Средняя       |
| 3   | Логотип канала перед названием видео         | Средний   | Низкая        |
| 4   | Фильтр кино/сериалы                          | Средний   | Высокая       |
| 5   | Фильтр по размеру рейтинга                   | Высокий   | Низкая        |
| 6   | Фильтр по наличию номинаций, наград          | Средний   | Средняя       |
| 7   | Фильтр по жанру                              | Средний   | Высокая       |
| 8   | Фильтр по тегу(ам)                           | Низкий    | Высокая       |
| 9   | Фильтр по эмоциям зрителей (AI)              | Низкий    | Очень высокая |

---

## Архитектурное решение

### 1. Новые типы данных

Добавить в `src/types/ui.ts`:

```typescript
// ============================================================================
// Advanced Feed Filters
// ============================================================================

/** Feed page size options */
export type FeedPageSize = 20 | 30 | 50 | 75 | 100;

/** Content type filter */
export type ContentTypeFilter = 'all' | 'movies' | 'series';

/** Rating range filter */
export interface RatingRangeFilter {
  min: number; // 0-10
  max: number; // 0-10
}

/** Award filter options */
export type AwardFilter = 'all' | 'oscar_winner' | 'oscar_nominated' | 'any_award' | 'no_awards';

/** Emotion filter (AI-based) */
export type EmotionFilter =
  | 'all'
  | 'inspiring'
  | 'thrilling'
  | 'romantic'
  | 'comedic'
  | 'dramatic'
  | 'scary'
  | 'action'
  | 'feel_good';

/** Complete feed filters state */
export interface FeedFilters {
  pageSize: FeedPageSize;
  selectedPlaylists: string[]; // CategoryDef IDs
  contentType: ContentTypeFilter;
  ratingRange: RatingRangeFilter;
  awardFilter: AwardFilter;
  genres: string[];
  tags: string[];
  emotion: EmotionFilter;
}

/** Default feed filters */
export const DEFAULT_FEED_FILTERS: FeedFilters = {
  pageSize: 30,
  selectedPlaylists: [], // empty = all
  contentType: 'all',
  ratingRange: { min: 0, max: 10 },
  awardFilter: 'all',
  genres: [],
  tags: [],
  emotion: 'all',
};
```

### 2. Расширенные типы видео

Добавить в `src/types/rutube.ts`:

```typescript
/** Extended video data with metadata */
export interface RutubeVideoExtended extends RutubeVideo {
  // Channel info
  channelId?: string;
  channelName?: string;
  channelLogoUrl?: string;

  // Content classification
  contentType?: 'movie' | 'series' | 'short' | 'unknown';
  genres?: string[];
  tags?: string[];
  year?: number;

  // Rating metadata
  kpRating?: number;
  imdbRating?: number;
  awards?: string[];

  // AI-analyzed emotions
  emotions?: string[];
}
```

### 3. Новый компонент FeedFiltersPanel

Создать файл `src/components/FeedFiltersPanel.tsx`:

```tsx
import React, { useState } from 'react';
import {
  Filter,
  X,
  ChevronDown,
  Star,
  Award,
  Film,
  Tv,
  Heart,
  Sparkles,
  Tag,
  Grid3X3,
} from 'lucide-react';
import {
  FeedFilters,
  FeedPageSize,
  ContentTypeFilter,
  RatingRangeFilter,
  AwardFilter,
  EmotionFilter,
  CategoryDef,
} from '../types';

interface FeedFiltersPanelProps {
  filters: FeedFilters;
  onFiltersChange: (filters: FeedFilters) => void;
  playlists: CategoryDef[];
  availableGenres: string[];
  availableTags: string[];
}

export const FeedFiltersPanel: React.FC<FeedFiltersPanelProps> = ({
  filters,
  onFiltersChange,
  playlists,
  availableGenres,
  availableTags,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof FeedFilters>(key: K, value: FeedFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.selectedPlaylists.length > 0 ||
    filters.contentType !== 'all' ||
    filters.ratingRange.min > 0 ||
    filters.ratingRange.max < 10 ||
    filters.awardFilter !== 'all' ||
    filters.genres.length > 0 ||
    filters.tags.length > 0 ||
    filters.emotion !== 'all';

  const clearAllFilters = () => {
    onFiltersChange(DEFAULT_FEED_FILTERS);
  };

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span className="font-medium">Фильтры ленты</span>
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">Активны</span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        <div className="flex items-center gap-3">
          {/* Page Size Selector */}
          <select
            value={filters.pageSize}
            onChange={e => updateFilter('pageSize', Number(e.target.value) as FeedPageSize)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300"
          >
            <option value={20}>20 видео</option>
            <option value={30}>30 видео</option>
            <option value={50}>50 видео</option>
            <option value={75}>75 видео</option>
            <option value={100}>100 видео</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Expandable Filters */}
      {isExpanded && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Playlist Filter */}
          <FilterSection title="Плейлисты" icon={<Grid3X3 className="w-4 h-4" />}>
            <PlaylistFilter
              playlists={playlists}
              selected={filters.selectedPlaylists}
              onChange={ids => updateFilter('selectedPlaylists', ids)}
            />
          </FilterSection>

          {/* Content Type Filter */}
          <FilterSection title="Тип контента" icon={<Film className="w-4 h-4" />}>
            <ContentTypeSelector
              value={filters.contentType}
              onChange={v => updateFilter('contentType', v)}
            />
          </FilterSection>

          {/* Rating Range Filter */}
          <FilterSection title="Рейтинг" icon={<Star className="w-4 h-4" />}>
            <RatingRangeSlider
              value={filters.ratingRange}
              onChange={v => updateFilter('ratingRange', v)}
            />
          </FilterSection>

          {/* Awards Filter */}
          <FilterSection title="Награды" icon={<Award className="w-4 h-4" />}>
            <AwardSelector
              value={filters.awardFilter}
              onChange={v => updateFilter('awardFilter', v)}
            />
          </FilterSection>

          {/* Genre Filter */}
          <FilterSection title="Жанры" icon={<Heart className="w-4 h-4" />}>
            <MultiSelect
              options={availableGenres}
              selected={filters.genres}
              onChange={v => updateFilter('genres', v)}
              placeholder="Выберите жанры..."
            />
          </FilterSection>

          {/* Tags Filter */}
          <FilterSection title="Теги" icon={<Tag className="w-4 h-4" />}>
            <MultiSelect
              options={availableTags}
              selected={filters.tags}
              onChange={v => updateFilter('tags', v)}
              placeholder="Выберите теги..."
            />
          </FilterSection>

          {/* Emotion Filter (AI) */}
          <FilterSection title="Эмоции (AI)" icon={<Sparkles className="w-4 h-4" />}>
            <EmotionSelector value={filters.emotion} onChange={v => updateFilter('emotion', v)} />
          </FilterSection>
        </div>
      )}
    </div>
  );
};
```

### 4. Хук для управления фильтрами

Создать файл `src/hooks/useFeedFilters.ts`:

```typescript
import { useState, useMemo, useCallback, useEffect } from 'react';
import { RutubeVideo, FeedFilters, DEFAULT_FEED_FILTERS, CategoryDef } from '../types';
import { useDebouncedValue } from '../utils/debounce';
import { analyzeVideoEmotions } from '../services/aiFilterService';

interface UseFeedFiltersProps {
  videos: RutubeVideo[];
  playlists: CategoryDef[];
  metadataCache: Record<string, { kpRating?: number; imdbRating?: number; awards?: string[] }>;
}

interface UseFeedFiltersResult {
  filters: FeedFilters;
  setFilters: React.Dispatch<React.SetStateAction<FeedFilters>>;
  filteredVideos: RutubeVideo[];
  displayedVideos: RutubeVideo[];
  availableGenres: string[];
  availableTags: string[];
}

export const useFeedFilters = ({
  videos,
  playlists,
  metadataCache,
}: UseFeedFiltersProps): UseFeedFiltersResult => {
  const [filters, setFilters] = useState<FeedFilters>(DEFAULT_FEED_FILTERS);

  // Extract available genres and tags from videos
  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    videos.forEach(v => v.genres?.forEach(g => genres.add(g)));
    return Array.from(genres).sort();
  }, [videos]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    videos.forEach(v => v.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [videos]);

  // Apply filters
  const filteredVideos = useMemo(() => {
    let result = [...videos];

    // 1. Playlist filter
    if (filters.selectedPlaylists.length > 0) {
      result = result.filter(v => filters.selectedPlaylists.includes(v.playlistId || ''));
    }

    // 2. Content type filter
    if (filters.contentType !== 'all') {
      result = result.filter(v => v.contentType === filters.contentType);
    }

    // 3. Rating range filter
    result = result.filter(v => {
      const rating = metadataCache[v.id]?.kpRating || v.rating / 10;
      return rating >= filters.ratingRange.min && rating <= filters.ratingRange.max;
    });

    // 4. Award filter
    if (filters.awardFilter !== 'all') {
      result = result.filter(v => {
        const awards = metadataCache[v.id]?.awards || [];
        switch (filters.awardFilter) {
          case 'oscar_winner':
            return awards.some(
              a => a.toLowerCase().includes('oscar') && a.toLowerCase().includes('won')
            );
          case 'oscar_nominated':
            return awards.some(a => a.toLowerCase().includes('oscar'));
          case 'any_award':
            return awards.length > 0;
          case 'no_awards':
            return awards.length === 0;
          default:
            return true;
        }
      });
    }

    // 5. Genre filter
    if (filters.genres.length > 0) {
      result = result.filter(v => filters.genres.some(g => v.genres?.includes(g)));
    }

    // 6. Tags filter
    if (filters.tags.length > 0) {
      result = result.filter(v => filters.tags.some(t => v.tags?.includes(t)));
    }

    // 7. Emotion filter (AI)
    if (filters.emotion !== 'all') {
      result = result.filter(v => v.emotions?.includes(filters.emotion));
    }

    return result;
  }, [videos, filters, metadataCache]);

  // Apply page size
  const displayedVideos = useMemo(() => {
    return filteredVideos.slice(0, filters.pageSize);
  }, [filteredVideos, filters.pageSize]);

  return {
    filters,
    setFilters,
    filteredVideos,
    displayedVideos,
    availableGenres,
    availableTags,
  };
};
```

---

## Детализация по функциям

### 1. Размер ленты (20...100)

**Реализация:**

- Простой select-компонент в заголовке фильтров
- Хранится в состоянии `filters.pageSize`
- Применяется через `slice(0, pageSize)` к отфильтрованным видео

**Код:**

```tsx
<select
  value={filters.pageSize}
  onChange={e => updateFilter('pageSize', Number(e.target.value))}
  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm"
>
  <option value={20}>20 видео</option>
  <option value={30}>30 видео</option>
  <option value={50}>50 видео</option>
  <option value={75}>75 видео</option>
  <option value={100}>100 видео</option>
</select>
```

### 2. Фильтр выбора плейлистов

**Реализация:**

- Multi-select компонент с чекбоксами
- Показывает все доступные плейлисты канала
- Пустой выбор = показывать все

**Код:**

```tsx
const PlaylistFilter: React.FC<{
  playlists: CategoryDef[];
  selected: string[];
  onChange: (ids: string[]) => void;
}> = ({ playlists, selected, onChange }) => {
  const togglePlaylist = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(x => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="max-h-40 overflow-y-auto space-y-1">
      {playlists.map(p => (
        <label key={p.id} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(p.id)}
            onChange={() => togglePlaylist(p.id)}
            className="rounded bg-zinc-800 border-zinc-600"
          />
          <span className="text-sm text-zinc-300">{p.label}</span>
          <span className="text-xs text-zinc-500">({p.itemCount})</span>
        </label>
      ))}
    </div>
  );
};
```

### 3. Логотип канала перед названием видео

**Реализация:**

- Добавить поле `channelLogoUrl` в расширенный тип видео
- Отображать в `VideoCard.tsx` перед title

**Изменения в VideoCard.tsx:**

```tsx
<div className="flex items-center gap-2 mb-1">
  {video.channelLogoUrl && (
    <img
      src={video.channelLogoUrl}
      alt={video.channelName}
      className="w-5 h-5 rounded-full object-cover"
    />
  )}
  <h3 className="text-white font-medium text-sm line-clamp-2">{video.title}</h3>
</div>
```

### 4. Фильтр кино/сериалы

**Реализация:**

- Требует классификации контента
- Варианты:
  1. **AI-классификация** — запрос к LLM при анализе видео
  2. **Эвристика** — по ключевым словам в названии ("сезон", "серия", "сериал")
  3. **Внешний API** — запрос к Kinopoisk API

**Рекомендуемый подход — AI-классификация при анализе:**

Добавить в `server/services/llm.js`:

```javascript
const movieRatingSchema = {
  type: Type.OBJECT,
  properties: {
    // ... existing properties
    contentType: {
      type: Type.STRING,
      description: "Content type: 'movie', 'series', or 'short'",
    },
    genres: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Genres: comedy, drama, thriller, etc.',
    },
  },
};
```

### 5. Фильтр по размеру рейтинга

**Реализация:**

- Range slider (min/max) от 0 до 10
- Фильтрация по `kpRating` из metadataCache или локальному rating

**Код:**

```tsx
const RatingRangeSlider: React.FC<{
  value: RatingRangeFilter;
  onChange: (v: RatingRangeFilter) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">От</span>
        <input
          type="number"
          min={0}
          max={10}
          step={0.5}
          value={value.min}
          onChange={e => onChange({ ...value, min: Number(e.target.value) })}
          className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
        />
        <span className="text-xs text-zinc-500">До</span>
        <input
          type="number"
          min={0}
          max={10}
          step={0.5}
          value={value.max}
          onChange={e => onChange({ ...value, max: Number(e.target.value) })}
          className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
        />
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={0.5}
        value={value.min}
        onChange={e => onChange({ ...value, min: Number(e.target.value) })}
        className="w-full accent-blue-500"
      />
    </div>
  );
};
```

### 6. Фильтр по наградам

**Реализация:**

- Выпадающий список с опциями
- Использует поле `awards` из `MovieRatingData`
- Уже реализовано в LLM сервисе (Oscar Won, Oscar Nominated)

**Код:**

```tsx
const AwardSelector: React.FC<{
  value: AwardFilter;
  onChange: (v: AwardFilter) => void;
}> = ({ value, onChange }) => {
  const options = [
    { value: 'all', label: 'Все' },
    { value: 'oscar_winner', label: '🏆 Оскароносец' },
    { value: 'oscar_nominated', label: '⭐ Номинант Оскара' },
    { value: 'any_award', label: '🎖 Любая награда' },
    { value: 'no_awards', label: 'Без наград' },
  ];

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as AwardFilter)}
      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
};
```

### 7. Фильтр по жанру

**Реализация:**

- Multi-select с поиском
- Жанры получаем из AI-анализа при запросе рейтингов
- Требует расширения схемы LLM

**Расширение схемы в llm.js:**

```javascript
genres: {
  type: Type.ARRAY,
  items: { type: Type.STRING },
  description: "Movie genres in Russian: комедия, драма, триллер, ужасы, боевик, мелодрама, фантастика, детектив, приключения, анимация, документальный, семейный",
},
```

### 8. Фильтр по тегам

**Реализация:**

- Multi-select с поиском
- Теги извлекаются из описания видео или keywords Rutube API
- Альтернатива — AI-извлечение тегов

**Извлечение тегов из Rutube API:**

```typescript
// В rutubeService.ts
const extractTagsFromVideo = (video: RutubeApiVideoItem): string[] => {
  const tags: string[] = [];

  // Из description
  const desc = video.description || '';
  const hashtagRegex = /#(\w+)/g;
  let match;
  while ((match = hashtagRegex.exec(desc)) !== null) {
    tags.push(match[1].toLowerCase());
  }

  return [...new Set(tags)];
};
```

### 9. Фильтр по эмоциям (AI)

**Реализация:**

- Требует нового AI endpoint `/api/ai/emotions`
- Анализирует title + description видео
- Кэширует результат в metadataCache

**Новый endpoint в server/routes/ai.js:**

```javascript
router.post('/api/ai/emotions', aiLimiter, async (req, res) => {
  const { title, description } = req.body;

  const prompt = `Analyze the emotional tone of this video content.
Title: "${title}"
Description: "${description}"

Return a JSON array of emotion tags (max 3) from this list:
inspiring, thrilling, romantic, comedic, dramatic, scary, action, feel_good, nostalgic, tense, heartwarming, thought-provoking

Return ONLY the JSON array, no explanation.`;

  try {
    const { provider, data } = await analyzeEmotions(prompt);
    res.json({ emotions: data, provider });
  } catch (e) {
    res.status(500).json({ error: 'Emotion analysis failed' });
  }
});
```

**Клиентский сервис:**

```typescript
// src/services/aiFilterService.ts
export const analyzeVideoEmotions = async (
  title: string,
  description: string
): Promise<string[]> => {
  const response = await fetch('/api/ai/emotions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });

  const data = await response.json();
  return data.emotions || [];
};
```

---

## План имплементации

### Фаза 1: Базовые фильтры (2-3 дня)

- [ ] Добавить типы `FeedFilters` в `src/types/ui.ts`
- [ ] Создать хук `useFeedFilters.ts`
- [ ] Создать компонент `FeedFiltersPanel.tsx` (базовая структура)
- [ ] Реализовать: размер ленты, фильтр плейлистов
- [ ] Интегрировать в `MainContent.tsx`

### Фаза 2: Рейтинги и награды (1-2 дня)

- [ ] Реализовать фильтр по рейтингу (range slider)
- [ ] Реализовать фильтр по наградам
- [ ] Добавить логотип канала в VideoCard

### Фаза 3: AI-расширения (3-4 дня)

- [ ] Расширить схему LLM для классификации контента
- [ ] Добавить жанры в AI-ответ
- [ ] Реализовать фильтр кино/сериалы
- [ ] Реализовать фильтр по жанрам

### Фаза 4: Продвинутые функции (2-3 дня)

- [ ] Реализовать извлечение тегов
- [ ] Создать AI endpoint для эмоций
- [ ] Реализовать фильтр по эмоциям
- [ ] Оптимизация производительности

---

## Структура файлов

```
src/
├── components/
│   ├── FeedFiltersPanel.tsx      # Новый: панель фильтров
│   ├── VideoCard.tsx             # Изменить: добавить логотип канала
│   └── UIComponents.tsx          # Изменить: добавить подкомпоненты фильтров
├── hooks/
│   ├── useFeedFilters.ts         # Новый: хук управления фильтрами
│   └── useFilters.ts             # Существующий: оставить для сортировки
├── services/
│   ├── aiFilterService.ts        # Новый: AI-анализ эмоций
│   └── rutubeService.ts          # Изменить: извлечение тегов
├── types/
│   ├── ui.ts                     # Изменить: добавить FeedFilters
│   └── rutube.ts                 # Изменить: добавить extended fields
server/
├── routes/
│   └── ai.js                     # Изменить: добавить endpoint /emotions
└── services/
    └── llm.js                    # Изменить: расширить схему
```

---

## Риски и ограничения

1. **Производительность AI** — фильтр по эмоциям требует отдельного запроса к LLM для каждого видео. Решение: фоновая предобработка и кэширование.

2. **Точность классификации** — AI может ошибаться в определении типа контента. Решение: добавить возможность ручной корректировки.

3. **Отсутствие данных** — многие видео не будут иметь информации о наградах/жанрах. Решение: показывать индикатор "данные отсутствуют".

4. **Rate limiting** — массовый AI-анализ может превысить лимиты API. Решение: очередность обработки, fallback на эвристику.
