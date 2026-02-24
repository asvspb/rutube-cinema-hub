# Метрики для определения предпочтений пользователя по просмотренным фильмам

> Документ описывает метрики, необходимые для построения рекомендательной системы на основе просмотров пользователей.

## Содержание

1. [Поведенческие метрики](#1-поведенческие-метрики)
2. [Временны́е метрики](#2-временны́е-метрики)
3. [Контентные метрики](#3-контентные-метрики-content-based)
4. [Метрики вовлечённости](#4-метрики-вовлечённости-engagement)
5. [Метрики для расчёта рекомендаций](#5-метрики-для-расчёта-рекомендаций)
6. [Предлагаемая структура данных](#6-предлагаемая-структура-данных)
7. [Метрики для реализации в проекте](#7-метрики-для-реализации-в-проекте)
8. [Примеры кода](#8-примеры-кода)

---

## 1. Поведенческие метрики

### Уже реализованы в проекте

- `VideoWatchedStatus` — статус просмотра (`watched` | `watch_later`)
- `VideoLikedStatus` — реакция (`liked` | `disliked`)
- `WatchHistoryItem` — история с `viewedAt` (timestamp)

### Рекомендуемые дополнительные метрики

| Метрика          | Описание                             | Вес для рекомендаций |
| ---------------- | ------------------------------------ | -------------------- |
| `watchDuration`  | % просмотра от общей длительности    | Высокий              |
| `rewatchCount`   | Количество повторных просмотров      | Очень высокий        |
| `completionRate` | Досмотрел ли до конца                | Высокий              |
| `pauseCount`     | Частота пауз (интерес vs скука)      | Средний              |
| `seekForward`    | Перемотки вперёд (признак скуки)     | Отрицательный        |
| `seekBackward`   | Перемотки назад (заинтересованность) | Положительный        |

---

## 2. Временны́е метрики

```typescript
interface TimeMetrics {
  timeOfDay: 'morning' | 'day' | 'evening' | 'night'; // Время просмотра
  dayOfWeek: number; // День недели (0-6)
  sessionDuration: number; // Длительность сессии
  averageViewTime: number; // Среднее время просмотра
  bingeWatching: boolean; // Смотрит несколько подряд
}
```

### Паттерны поведения

| Паттерн            | Интерпретация                        |
| ------------------ | ------------------------------------ |
| Вечерние просмотры | Предпочтение расслабляющего контента |
| Ночные просмотры   | Сериалы, длинный контент             |
| Короткие сессии    | Shorts, клипы, трейлеры              |
| Выходные дни       | Время для полнометражных фильмов     |
| Binge-watching     | Высокая вовлечённость в сериалы      |

---

## 3. Контентные метрики (Content-Based)

На основе `MovieRatingData` из проекта:

```typescript
interface ContentPreferences {
  // Жанры
  genres: Map<string, number>; // genre → score

  // Годы выпуска
  yearRange: { min: number; max: number; preferred: number };

  // Длительность
  durationPreference: 'short' | 'medium' | 'long' | 'any';

  // Рейтинги
  minRating: { kp: number; imdb: number };

  // Источники
  preferredChannels: Map<string, number>; // channelId → affinity

  // Награды
  awardPreference: number; // 0-1, prefers award-winning content
}
```

### Категоризация по длительности

| Категория | Длительность | Примеры                          |
| --------- | ------------ | -------------------------------- |
| Short     | < 10 мин     | Shorts, клипы, трейлеры          |
| Medium    | 10-40 мин    | Серии мультфильмов, документалки |
| Long      | > 40 мин     | Фильмы, длинные выпуски          |

---

## 4. Метрики вовлечённости (Engagement)

```typescript
interface EngagementMetrics {
  // Явные действия
  like: number; // +1.0
  dislike: number; // -1.0
  watchLater: number; // +0.5 (интерес, но нет времени)
  share: number; // +1.5 (высокая вовлечённость)
  comment: number; // +0.8

  // Неявные сигналы
  addToPlaylist: number; // +0.7
  replayVideo: number; // +1.0
  openDescription: number; // +0.3
  fullscreenView: number; // +0.4
  volumeChange: number; // ±0.2 (громче = интереснее)
}
```

### Таблица весов вовлечённости

| Действие    | Вес  | Обоснование                  |
| ----------- | ---- | ---------------------------- |
| Like        | +1.0 | Явный положительный сигнал   |
| Dislike     | -3.0 | Сильный отрицательный сигнал |
| Share       | +1.5 | Высшая форма вовлечённости   |
| Watch Later | +0.5 | Отложенный интерес           |
| Replay      | +1.0 | Повторный просмотр = интерес |
| Fullscreen  | +0.4 | Погружение в контент         |

---

## 5. Метрики для расчёта рекомендаций

### Формула общего score

```
score = Σ(watchWeight × duration%)
      + (likeWeight × likeCount)
      - (dislikeWeight × dislikeCount)
      + (replayWeight × replayCount)
      + (timeOfDayBonus)
      + (channelAffinity)
      - (skipPenalty)
```

### Веса для формулы

```typescript
const RECOMMENDATION_WEIGHTS = {
  // Просмотр
  completed: 1.0, // Досмотрел до конца
  duration50: 0.5, // >50% просмотра
  duration80: 0.8, // >80% просмотра

  // Реакции
  liked: 2.0, // Лайк
  disliked: -3.0, // Дизлайк
  rewatched: 1.5, // Пересмотр

  // Организация
  watchLater: 0.5, // В "Посмотреть позже"
  addToPlaylist: 0.7, // Добавил в плейлист

  // Контекст
  sameChannel: 0.3, // Тот же канал
  sameGenre: 0.4, // Тот же жанр
  sameCategory: 0.3, // Та же категория
  timeMatch: 0.2, // Совпадение времени просмотра

  // Штрафы
  skipEarly: -0.5, // Бросил просмотр
  skipAfterPreview: -0.3, // Ушёл после превью
};
```

---

## 6. Предлагаемая структура данных

### UserPreferences

```typescript
interface UserPreferences {
  userId: string;

  // Явные предпочтения
  likedGenres: Record<string, number>;
  dislikedGenres: Record<string, number>;
  likedChannels: Record<string, number>;

  // Поведенческие паттерны
  avgWatchDuration: number;
  preferredVideoLength: 'short' | 'medium' | 'long';
  peakViewingHours: number[];

  // История взаимодействий
  totalWatched: number;
  totalLiked: number;
  totalDisliked: number;
  watchStreak: number; // Дней подряд

  // Скользящее окно (последние N просмотров)
  recentAffinity: {
    channels: Record<string, number>;
    categories: Record<string, number>;
  };

  // Временные метки
  lastUpdated: number;
  preferencesDecay: number; // Коэффициент затухания старых предпочтений
}
```

### WatchSession

```typescript
interface WatchSession {
  sessionId: string;
  userId: string;
  videoId: string;

  // Время
  startedAt: number;
  endedAt: number | null;

  // Прогресс
  duration: number; // Общая длительность видео
  watchedDuration: number; // Просмотренная часть
  lastPosition: number; // Последняя позиция

  // Действия
  pauses: number;
  seeks: Array<{ time: number; direction: 'forward' | 'backward'; amount: number }>;

  // Результат
  completed: boolean;
  exitReason?: 'finished' | 'user_left' | 'skipped' | 'error';
}
```

---

## 7. Метрики для реализации в проекте

### Минимальный набор (MVP)

| Метрика                   | Статус            | Приоритет  |
| ------------------------- | ----------------- | ---------- |
| `watched` / `watch_later` | ✅ Реализовано    | -          |
| `liked` / `disliked`      | ✅ Реализовано    | -          |
| `watchDurationPercent`    | ⬜ Не реализовано | **High**   |
| `completionRate`          | ⬜ Не реализовано | **High**   |
| `channelAffinity`         | ⬜ Не реализовано | **Medium** |
| `categoryAffinity`        | ⬜ Не реализовано | **Medium** |

### Приоритет внедрения

1. **High Priority:**
   - `watchDurationPercent` — ключевой показатель интереса
   - `completionRate` — досмотренность контента

2. **Medium Priority:**
   - `rewatchCount` — повторные просмотры
   - `timeOfDay` паттерны — временны́е предпочтения
   - `channelAffinity` — предпочтения каналов

3. **Low Priority:**
   - `seekPatterns` — паттерны перемотки
   - `volumeChanges` — изменения громкости
   - `pausePatterns` — паттерны пауз

---

## 8. Примеры кода

### Расширение WatchHistoryItem

```typescript
// src/types/ui.ts

/** Расширенный элемент истории просмотров */
export interface WatchHistoryItemExtended extends WatchHistoryItem {
  // Длительность
  videoDuration?: number; // Общая длительность видео (сек)
  watchedDuration?: number; // Сколько просмотрено (сек)
  watchPercent?: number; // Процент просмотра (0-100)

  // Статус
  completed?: boolean; // Досмотрел ли до конца
  rewatchCount?: number; // Количество повторных просмотров

  // Позиция
  lastPosition?: number; // Последняя позиция (для продолжения)

  // Время
  timeOfDay?: 'morning' | 'day' | 'evening' | 'night';
  dayOfWeek?: number; // 0-6

  // Метаданные
  genre?: string; // Жанр (если известен)
  category?: string; // Категория
}
```

### Функция расчёта предпочтений

```typescript
// src/services/preferenceService.ts

import { WatchHistoryItemExtended, VideoLikedStatusMap } from '../types';

interface PreferenceScore {
  channelId: string;
  score: number;
  interactions: number;
  avgWatchPercent: number;
}

export function calculateChannelPreferences(
  history: WatchHistoryItemExtended[],
  likedStatuses: VideoLikedStatusMap
): PreferenceScore[] {
  const channelScores: Record<string, PreferenceScore> = {};

  for (const item of history) {
    if (!item.channelId) continue;

    if (!channelScores[item.channelId]) {
      channelScores[item.channelId] = {
        channelId: item.channelId,
        score: 0,
        interactions: 0,
        avgWatchPercent: 0,
      };
    }

    const channel = channelScores[item.channelId];
    channel.interactions++;

    // Базовый балл за просмотр
    channel.score += 0.1;

    // Бонус за процент просмотра
    if (item.watchPercent) {
      channel.score += item.watchPercent / 100;
      channel.avgWatchPercent =
        (channel.avgWatchPercent * (channel.interactions - 1) + item.watchPercent) /
        channel.interactions;
    }

    // Бонус за досмотренность
    if (item.completed) {
      channel.score += 0.5;
    }

    // Бонус за повторный просмотр
    if (item.rewatchCount && item.rewatchCount > 0) {
      channel.score += item.rewatchCount * 0.3;
    }
  }

  // Применяем лайки/дизлайки
  for (const [videoId, status] of Object.entries(likedStatuses)) {
    const historyItem = history.find(h => h.videoId === videoId);
    if (historyItem?.channelId) {
      const channel = channelScores[historyItem.channelId];
      if (channel) {
        channel.score += status === 'liked' ? 1.0 : -2.0;
      }
    }
  }

  return Object.values(channelScores).sort((a, b) => b.score - a.score);
}
```

### Функция расчёта рекомендаций

```typescript
// src/services/recommendationService.ts

import { RutubeVideo } from '../types/rutube';
import { UserPreferences, RECOMMENDATION_WEIGHTS } from './preferenceTypes';

interface RecommendedVideo extends RutubeVideo {
  recommendationScore: number;
  recommendationReasons: string[];
}

export function calculateRecommendations(
  videos: RutubeVideo[],
  preferences: UserPreferences,
  options: { limit?: number; minScore?: number } = {}
): RecommendedVideo[] {
  const { limit = 20, minScore = 0.5 } = options;

  const scored = videos.map(video => {
    let score = 0;
    const reasons: string[] = [];

    // Бонус за канал
    const channelScore = preferences.likedChannels[video.channelId || ''] || 0;
    if (channelScore > 0) {
      score += channelScore * RECOMMENDATION_WEIGHTS.sameChannel;
      reasons.push('Любимый канал');
    }

    // Бонус за жанр
    const genreScore = preferences.likedGenres[video.genre || ''] || 0;
    if (genreScore > 0) {
      score += genreScore * RECOMMENDATION_WEIGHTS.sameGenre;
      reasons.push('Любимый жанр');
    }

    // Бонус за рейтинг
    if (video.rating >= preferences.minRating.kp) {
      score += 0.2;
      reasons.push('Высокий рейтинг');
    }

    // Бонус за соответствие предпочтениям по длительности
    if (video.duration && matchesDurationPreference(video.duration, preferences)) {
      score += 0.15;
      reasons.push('Подходящая длительность');
    }

    return {
      ...video,
      recommendationScore: score,
      recommendationReasons: reasons,
    };
  });

  return scored
    .filter(v => v.recommendationScore >= minScore)
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, limit);
}

function matchesDurationPreference(duration: number, prefs: UserPreferences): boolean {
  const mins = duration / 60;
  switch (prefs.preferredVideoLength) {
    case 'short':
      return mins < 10;
    case 'medium':
      return mins >= 10 && mins <= 40;
    case 'long':
      return mins > 40;
    default:
      return true;
  }
}
```

---

## Заключение

Для построения эффективной рекомендательной системы в проекте `rutube-cinema-hub` рекомендуется:

1. **Расширить `WatchHistoryItem`** метриками длительности и завершённости просмотра
2. **Реализовать сервис `PreferenceService`** для расчёта предпочтений пользователя
3. **Добавить `RecommendationService`** для генерации персонализированных рекомендаций
4. **Использовать поэтапный подход** — начать с MVP метрик и постепенно расширять

---

_Документ создан: 23.02.2026_
_Последнее обновление: 23.02.2026_
