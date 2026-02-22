# План имплементации поддержки Metainfo TV

> **Дата создания:** 2026-02-22  
> **Статус:** Планирование завершено, готово к реализации

## Обзор

Добавление поддержки ссылок типа `rutube.ru/metainfo/tv/{id}/` для ТВ-шоу и сериалов с возможностью фильтрации по сезонам и получения последних видео.

---

## Исследование API

### Обнаруженные endpoints

| Endpoint                         | Описание                      | Формат |
| -------------------------------- | ----------------------------- | ------ |
| `/api/metainfo/tv/{id}/`         | Метаданные ТВ-шоу             | JSON   |
| `/api/metainfo/tv/{id}/video/`   | Все видео шоу (пагинация)     | JSON   |
| `/api/metainfo/tv/{id}/latest/`  | Последние видео               | JSON   |
| `/api/metainfo/tv/{id}/seasons/` | Видео по сезонам              | JSON   |
| `/api/video/{video_id}/`         | Информация о конкретном видео | JSON   |

### URL паттерны для поддержки

```
# ТВ-шоу (основное)
rutube.ru/metainfo/tv/{id}/           → все видео
rutube.ru/metainfo/tv/{id}/latest/    → последние видео
rutube.ru/metainfo/tv/{id}/season{N}/ → конкретный сезон (N = 1, 2, 3...)

# Отдельное видео
rutube.ru/video/{video_id}/           → информация о видео
```

### Структура ответа API

#### Метаданные шоу (`/api/metainfo/tv/10/`)

```json
{
  "id": 10,
  "name": "Камеди Клаб",
  "description": "Шоу Comedy Club...",
  "poster_url": "https://pic.rtbcdn.ru/tv/...",
  "type": { "id": 2, "name": "tvshow", "title": "Телепередача" },
  "seasons_count": 23,
  "year_start": "2005",
  "subscribers_count": 382388,
  "content": "https://rutube.ru/api/metainfo/tv/10/video"
}
```

#### Видео из шоу (`/api/metainfo/tv/10/video/`)

```json
{
  "results": [
    {
      "id": "0051e5e49ddc72b648a07d657f51f882",
      "title": "Comedy Club: «Шерлок Холмс»",
      "thumbnail_url": "https://pic.rutube.ru/video/...",
      "video_url": "https://rutube.ru/video/...",
      "duration": 595,
      "hits": 75954,
      "created_ts": "2021-08-25T17:59:36",
      "season": 0,
      "episode": 0,
      "author": { "name": "Телеканал ТНТ" }
    }
  ],
  "has_next": true,
  "next": "?page=2",
  "page": 1,
  "per_page": 50
}
```

---

## Этапы реализации

### Этап 1: Типы данных

#### `src/types/ui.ts` - Расширить CategoryDef

```typescript
export interface CategoryDef {
  id: string;
  label: string;
  rutubeId: string;
  type: 'channel' | 'playlist' | 'metainfo_tv'; // Добавить metainfo_tv
  isSystem?: boolean;
  itemCount?: number;
  // Новые поля для metainfo_tv
  subtype?: 'all' | 'latest' | 'season'; // Подтип фида
  season?: number; // Номер сезона (если subtype = 'season')
  posterUrl?: string; // Постер шоу
}
```

#### `src/types/rutube.ts` - Добавить интерфейсы

```typescript
/** Метаданные ТВ-шоу из API */
export interface RutubeApiMetainfoTvShow {
  id: number;
  name: string;
  description?: string;
  poster_url?: string;
  vertical_poster_url?: string;
  type?: {
    id: number;
    name: string;
    title: string;
  };
  seasons_count?: number;
  year_start?: string;
  year_end?: string;
  subscribers_count?: number;
  content: string; // URL для видео
}

/** Видео из ТВ-шоу (с полями сезона/эпизода) */
export interface RutubeApiMetainfoTvVideoItem {
  id: string;
  title: string;
  thumbnail_url: string;
  video_url: string;
  duration: number;
  hits: number;
  created_ts: string;
  publication_ts?: string;
  description?: string;
  season?: number;
  episode?: number;
  author?: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  category?: {
    id: number;
    name: string;
  };
}

/** Ответ API с пагинацией для ТВ-видео */
export interface RutubeApiMetainfoTvVideoResponse {
  results: RutubeApiMetainfoTvVideoItem[];
  has_next: boolean;
  next?: string | null;
  page?: number;
  per_page?: number;
}
```

---

### Этап 2: Парсинг URL

#### `src/services/rutubeService.ts` - Расширить parseRutubeUrl()

```typescript
export const parseRutubeUrl = (
  url: string
): {
  id: string;
  type: 'channel' | 'playlist' | 'metainfo_tv' | 'video';
  subtype?: string;
  season?: number;
} | null => {
  try {
    let urlToParse = url.trim();
    if (!/^https?:\/\//i.test(urlToParse)) {
      urlToParse = 'https://' + urlToParse;
    }

    const urlObj = new URL(urlToParse);
    const path = urlObj.pathname;

    // ТВ-шоу - конкретный сезон (проверяем первым, более специфичный паттерн)
    const seasonMatch = path.match(/\/metainfo\/tv\/(\d+)\/season(\d+)\/?$/);
    if (seasonMatch && seasonMatch[1]) {
      return {
        id: seasonMatch[1],
        type: 'metainfo_tv',
        subtype: 'season',
        season: parseInt(seasonMatch[2], 10),
      };
    }

    // ТВ-шоу - latest
    const latestMatch = path.match(/\/metainfo\/tv\/(\d+)\/latest\/?$/);
    if (latestMatch && latestMatch[1]) {
      return { id: latestMatch[1], type: 'metainfo_tv', subtype: 'latest' };
    }

    // ТВ-шоу - все видео (базовый паттерн)
    const tvMatch = path.match(/\/metainfo\/tv\/(\d+)\/?$/);
    if (tvMatch && tvMatch[1]) {
      return { id: tvMatch[1], type: 'metainfo_tv', subtype: 'all' };
    }

    // Канал по ID
    const channelMatch = path.match(/\/channel\/(\d+)/);
    if (channelMatch && channelMatch[1]) {
      return { id: channelMatch[1], type: 'channel' };
    }

    // Канал по username/slug
    const userMatch = path.match(/\/u\/([^/]+)/);
    if (userMatch && userMatch[1]) {
      return { id: userMatch[1], type: 'channel' };
    }

    // Плейлист
    const playlistMatch = path.match(/\/plst\/(\d+)/);
    if (playlistMatch && playlistMatch[1]) {
      return { id: playlistMatch[1], type: 'playlist' };
    }

    // Отдельное видео
    const videoMatch = path.match(/\/video\/([a-z0-9]+)\/?$/);
    if (videoMatch && videoMatch[1]) {
      return { id: videoMatch[1], type: 'video' };
    }

    return null;
  } catch {
    return null;
  }
};
```

---

### Этап 3: Загрузка видео

#### `src/services/rutubeService.ts` - Добавить функции

```typescript
/** Получить метаданные ТВ-шоу */
export const fetchMetainfoTvShow = async (
  tvId: string,
  options?: { signal?: AbortSignal }
): Promise<RutubeApiMetainfoTvShow | null> => {
  const apiUrl = `${BASE_API}/metainfo/tv/${tvId}/`;
  try {
    const text = await fetchTextWithRace(apiUrl, options);
    const data = parseProxyResponse(text);
    if (data && typeof data === 'object' && 'id' in data) {
      return data as RutubeApiMetainfoTvShow;
    }
  } catch {
    /* ignore */
  }
  return null;
};

/** Загрузить видео из ТВ-шоу */
export const fetchMetainfoTvVideos = async (
  category: CategoryDef,
  settings: RatingSettings = DEFAULT_RATING_SETTINGS,
  nextPageCursor?: string | null,
  fetchAll: boolean = false,
  options?: { signal?: AbortSignal }
): Promise<{ videos: RutubeVideo[]; nextUrl: string | null }> => {
  const tvId = category.rutubeId;
  const subtype = category.subtype || 'all';
  const season = category.season;

  // Определяем базовый URL
  let baseUrl: string;
  switch (subtype) {
    case 'latest':
      baseUrl = `${BASE_API}/metainfo/tv/${tvId}/latest/`;
      break;
    case 'season':
      // Для сезона используем фильтрацию через параметры
      baseUrl = `${BASE_API}/metainfo/tv/${tvId}/video/?season=${season}`;
      break;
    default:
      baseUrl = `${BASE_API}/metainfo/tv/${tvId}/video/`;
  }

  // Если есть курсор пагинации, используем его
  const apiUrl = nextPageCursor || baseUrl;

  const { results, next } = await fetchSinglePage(apiUrl, options);

  const videos = results
    .map(item => mapRutubeItem(item as RutubeApiVideoItem, settings))
    .filter((item): item is RutubeVideo => item !== null);

  return { videos, nextUrl: next };
};
```

#### Обновить fetchVideos()

```typescript
export const fetchVideos = async (
  category: CategoryDef,
  settings: RatingSettings = DEFAULT_RATING_SETTINGS,
  nextPageCursor?: string | null,
  fetchAll: boolean = false,
  options?: { signal?: AbortSignal }
): Promise<{ videos: RutubeVideo[]; nextUrl: string | null }> => {
  // Новый тип - metainfo_tv
  if (category.type === 'metainfo_tv') {
    return fetchMetainfoTvVideos(category, settings, nextPageCursor, fetchAll, options);
  }

  // ... существующий код для channel и playlist
};
```

---

### Этап 4: UI компоненты

#### `src/components/AddCategoryModal.tsx` - Обновить подсказки

```tsx
// Обновить placeholder и hint
<input
  placeholder="rutube.ru/plst/..., rutube.ru/channel/..., rutube.ru/metainfo/tv/..."
/>
<p className="text-xs text-zinc-500 mt-1.5">
  Поддерживаются: плейлисты (/plst/), каналы (/channel/, /u/), ТВ-шоу (/metainfo/tv/)
</p>
```

#### Обновить сообщение об ошибке

```tsx
throw new Error(
  'Некорректная ссылка. Используйте: rutube.ru/plst/..., rutube.ru/channel/..., rutube.ru/u/..., rutube.ru/metainfo/tv/...'
);
```

---

## Преимущества metainfo/tv

| Особенность              | Канал/Плейлист | Metainfo TV                 |
| ------------------------ | -------------- | --------------------------- |
| Сезоны/эпизоды           | ❌             | ✅ `season`, `episode`      |
| Постер шоу               | ❌             | ✅ `poster_url`             |
| Количество подписчиков   | ✅             | ✅                          |
| Описание шоу             | ❌             | ✅                          |
| Количество сезонов       | ❌             | ✅ `seasons_count`          |
| Годы выхода              | ❌             | ✅ `year_start`, `year_end` |
| Структурированные данные | ❌             | ✅                          |

---

## Файлы для изменения

| Файл                                  | Изменения                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------- |
| `src/types/ui.ts`                     | Добавить `metainfo_tv` в CategoryDef.type, поля subtype, season, posterUrl |
| `src/types/rutube.ts`                 | Добавить интерфейсы для TV API                                             |
| `src/types/schemas.ts`                | Добавить Zod схемы для валидации                                           |
| `src/types/index.ts`                  | Реэкспорт новых типов                                                      |
| `src/services/rutubeService.ts`       | Расширить parseRutubeUrl(), добавить fetchMetainfoTvVideos()               |
| `src/components/AddCategoryModal.tsx` | Обновить подсказки и сообщения об ошибках                                  |
| `src/components/AddChannelModal.tsx`  | (опционально) Добавить поддержку metainfo/tv                               |

---

## Тестирование

### Необходимые тесты

1. **Unit тесты для parseRutubeUrl()**
   - Проверка всех новых паттернов URL
   - Граничные случаи

2. **Unit тесты для fetchMetainfoTvVideos()**
   - Мокирование API ответов
   - Пагинация

3. **Интеграционные тесты**
   - Реальные запросы к API (если доступно)

### Тестовые URL

```
# ТВ-шоу - все видео
https://rutube.ru/metainfo/tv/10/

# ТВ-шоу - последние
https://rutube.ru/metainfo/tv/10/latest/

# ТВ-шоу - сезон 17
https://rutube.ru/metainfo/tv/10/season17/

# Отдельное видео
https://rutube.ru/video/9d94f8ff02f725e382332e0b71bde99c/
```

---

## Оценка трудозатрат

| Этап           | Время       |
| -------------- | ----------- |
| Типы данных    | 30 мин      |
| Парсинг URL    | 20 мин      |
| Загрузка видео | 1 час       |
| UI компоненты  | 20 мин      |
| Тестирование   | 1 час       |
| **Итого**      | **~3 часа** |
