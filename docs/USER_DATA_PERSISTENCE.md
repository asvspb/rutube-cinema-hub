# Разграничение прав и сохранение данных пользователей

## Обзор

В этом документе описывается система разграничения прав между гостями и авторизованными пользователями, а также механизм сохранения данных пользователей на сервере.

---

## 1. Разграничение прав Гостя и Пользователя

### 1.1. Определения

| Роль             | Определение                 | Признак в коде           |
| ---------------- | --------------------------- | ------------------------ |
| **Гость**        | Неавторизованный посетитель | `req.user === undefined` |
| **Пользователь** | Авторизованный пользователь | `req.user` существует    |

### 1.2. Middleware для разграничения

Проект уже содержит необходимые middleware в `server/middleware/authMiddleware.js`:

```javascript
// optionalAuth — пропускает всех, добавляет req.user если есть токен
router.get('/videos', optionalAuth, getVideos);

// authenticateToken — требует наличия валидного токена
router.post('/favorites', authenticateToken, addFavorite);

// requireAuth — проверяет что req.user установлен
router.post('/settings', authenticateToken, requireAuth, updateSettings);

// requireVerified — требует верифицированный email
router.post('/comments', authenticateToken, requireVerified, addComment);
```

### 1.3. Матрица доступа

| Действие                       | Гость | Пользователь | Middleware                              |
| ------------------------------ | ----- | ------------ | --------------------------------------- |
| Просмотр видео                 | ✅    | ✅           | `optionalAuth`                          |
| Поиск                          | ✅    | ✅           | `optionalAuth`                          |
| История просмотров (локальная) | ✅    | ✅           | —                                       |
| Избранное                      | ❌    | ✅           | `authenticateToken`                     |
| Синхронизация данных           | ❌    | ✅           | `authenticateToken`                     |
| Комментарии                    | ❌    | ✅           | `authenticateToken` + `requireVerified` |
| Личный кабинет                 | ❌    | ✅           | `authenticateToken`                     |

### 1.4. Пример использования на фронтенде

```tsx
import { useAuth } from '../hooks/useAuth';

function VideoActions({ videoId }: { videoId: string }) {
  const { user, isAuthenticated } = useAuth();

  const handleAddToFavorites = async () => {
    if (!isAuthenticated) {
      showLoginModal();
      return;
    }
    await addToFavorites(videoId);
  };

  return (
    <div>
      <button onClick={handleAddToFavorites}>
        {isAuthenticated ? 'В избранное' : 'Войдите для добавления в избранное'}
      </button>
    </div>
  );
}
```

---

## 2. Система хранения данных

### 2.1. Текущая реализация (localStorage + IndexedDB)

Данные хранятся локально в браузере пользователя:

| Данные             | Хранилище    | Ключ                                     |
| ------------------ | ------------ | ---------------------------------------- |
| Каналы             | localStorage | `rutube_cinema_v2_channels`              |
| История просмотров | localStorage | `rutube_cinema_v2_history_user/guest`    |
| Статусы видео      | localStorage | `rutube_cinema_v2_statuses_user/guest_*` |
| Метаданные         | IndexedDB    | `metadata_cache`                         |
| Кэш видео          | IndexedDB    | `video_cache`                            |

**Проблема:** Данные привязаны к конкретному браузеру и теряются при:

- Смене устройства
- Смене браузера
- Очистке кэша

### 2.2. Решение: Серверное хранение для пользователей

Для авторизованных пользователей данные должны синхронизироваться с сервером.

---

## 3. Реализация серверного хранения

### 3.1. Расширение Prisma схемы

Добавить в `prisma/schema.base.prisma`:

```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  isActive     Boolean   @default(true)
  isVerified   Boolean   @default(false)
  verifiedAt   DateTime?
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  sessions     Session[]

  // Новые связи
  favorites    UserFavorite[]
  watchHistory WatchHistory[]
  videoStatuses VideoStatus[]

  @@index([email])
}

// Избранное пользователя
model UserFavorite {
  id           String   @id @default(uuid())
  userId       String
  videoId      String
  videoTitle   String?
  channelName  String?
  thumbnailUrl String?
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, videoId])
  @@index([userId])
}

// История просмотров
model WatchHistory {
  id        String   @id @default(uuid())
  userId    String
  videoId   String
  progress  Int?     // Прогресс просмотра в секундах
  duration  Int?     // Общая длительность
  watchedAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, videoId])
  @@index([userId])
  @@index([watchedAt])
}

// Статусы видео (просмотрено, в очереди, лайк/дизлайк)
model VideoStatus {
  id        String   @id @default(uuid())
  userId    String
  videoId   String
  status    String   // "watched", "watch_later", "liked", "disliked"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, videoId])
  @@index([userId])
  @@index([status])
}
```

### 3.2. API маршруты

Создать `server/routes/userData.js`:

```javascript
import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import prisma from '../db/prismaClient.js';

const router = Router();

// ==================== Статусы видео ====================

/**
 * POST /api/user/video-status
 * Сохранить статус видео
 */
router.post('/video-status', authenticateToken, async (req, res) => {
  const { videoId, status, videoTitle, channelName, thumbnailUrl } = req.body;

  if (!videoId || !status) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'videoId and status are required' },
    });
  }

  const validStatuses = ['watched', 'watch_later', 'liked', 'disliked'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_STATUS',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      },
    });
  }

  try {
    const result = await prisma.videoStatus.upsert({
      where: {
        userId_videoId: {
          userId: req.user.id,
          videoId,
        },
      },
      update: { status },
      create: {
        userId: req.user.id,
        videoId,
        status,
      },
    });

    res.json(result);
  } catch (error) {
    console.error('Error saving video status:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to save video status' },
    });
  }
});

/**
 * DELETE /api/user/video-status/:videoId
 * Удалить статус видео
 */
router.delete('/video-status/:videoId', authenticateToken, async (req, res) => {
  const { videoId } = req.params;

  try {
    await prisma.videoStatus.delete({
      where: {
        userId_videoId: {
          userId: req.user.id,
          videoId,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Video status not found' },
      });
    }
    console.error('Error deleting video status:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to delete video status' },
    });
  }
});

/**
 * GET /api/user/video-statuses
 * Получить все статусы пользователя
 */
router.get('/video-statuses', authenticateToken, async (req, res) => {
  try {
    const statuses = await prisma.videoStatus.findMany({
      where: { userId: req.user.id },
    });

    // Преобразуем в удобный формат
    const result = {
      watched: {},
      watchLater: {},
      liked: {},
      disliked: {},
    };

    statuses.forEach(s => {
      if (s.status === 'watched') result.watched[s.videoId] = true;
      if (s.status === 'watch_later') result.watchLater[s.videoId] = true;
      if (s.status === 'liked') result.liked[s.videoId] = true;
      if (s.status === 'disliked') result.disliked[s.videoId] = true;
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching video statuses:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch video statuses' },
    });
  }
});

// ==================== Избранное ====================

/**
 * POST /api/user/favorites
 * Добавить видео в избранное
 */
router.post('/favorites', authenticateToken, async (req, res) => {
  const { videoId, videoTitle, channelName, thumbnailUrl } = req.body;

  if (!videoId) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'videoId is required' },
    });
  }

  try {
    const favorite = await prisma.userFavorite.create({
      data: {
        userId: req.user.id,
        videoId,
        videoTitle,
        channelName,
        thumbnailUrl,
      },
    });

    res.status(201).json(favorite);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: { code: 'ALREADY_EXISTS', message: 'Video already in favorites' },
      });
    }
    console.error('Error adding to favorites:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to add to favorites' },
    });
  }
});

/**
 * DELETE /api/user/favorites/:videoId
 * Удалить из избранного
 */
router.delete('/favorites/:videoId', authenticateToken, async (req, res) => {
  const { videoId } = req.params;

  try {
    await prisma.userFavorite.delete({
      where: {
        userId_videoId: {
          userId: req.user.id,
          videoId,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Favorite not found' },
      });
    }
    console.error('Error removing from favorites:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to remove from favorites' },
    });
  }
});

/**
 * GET /api/user/favorites
 * Получить список избранного
 */
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const favorites = await prisma.userFavorite.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch favorites' },
    });
  }
});

// ==================== История просмотров ====================

/**
 * POST /api/user/watch-history
 * Добавить/обновить запись в истории
 */
router.post('/watch-history', authenticateToken, async (req, res) => {
  const { videoId, progress, duration } = req.body;

  if (!videoId) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'videoId is required' },
    });
  }

  try {
    const result = await prisma.watchHistory.upsert({
      where: {
        userId_videoId: {
          userId: req.user.id,
          videoId,
        },
      },
      update: {
        progress,
        duration,
        watchedAt: new Date(),
      },
      create: {
        userId: req.user.id,
        videoId,
        progress,
        duration,
      },
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating watch history:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to update watch history' },
    });
  }
});

/**
 * GET /api/user/watch-history
 * Получить историю просмотров
 */
router.get('/watch-history', authenticateToken, async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;

  try {
    const history = await prisma.watchHistory.findMany({
      where: { userId: req.user.id },
      orderBy: { watchedAt: 'desc' },
      take: limit,
    });

    res.json(history);
  } catch (error) {
    console.error('Error fetching watch history:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch watch history' },
    });
  }
});

/**
 * DELETE /api/user/watch-history/:videoId
 * Удалить запись из истории
 */
router.delete('/watch-history/:videoId', authenticateToken, async (req, res) => {
  const { videoId } = req.params;

  try {
    await prisma.watchHistory.delete({
      where: {
        userId_videoId: {
          userId: req.user.id,
          videoId,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'History entry not found' },
      });
    }
    console.error('Error deleting from watch history:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to delete from watch history' },
    });
  }
});

/**
 * DELETE /api/user/watch-history
 * Очистить всю историю
 */
router.delete('/watch-history', authenticateToken, async (req, res) => {
  try {
    await prisma.watchHistory.deleteMany({
      where: { userId: req.user.id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing watch history:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to clear watch history' },
    });
  }
});

export default router;
```

### 3.3. Регистрация маршрутов

Добавить в `server/index.js`:

```javascript
import userDataRoutes from './routes/userData.js';

// ... после других маршрутов
app.use('/api/user', userDataRoutes);
```

### 3.4. Синхронизация на фронтенде

Обновить `src/services/storageService.ts`:

```typescript
// Добавить методы для синхронизации с сервером

class StorageService {
  private static API_BASE = '/api/user';

  /**
   * Синхронизировать данные с сервера при логине
   */
  static async syncFromServer(): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/video-statuses`);
      if (response.ok) {
        const serverData = await response.json();

        // Объединяем с локальными данными
        const localWatched = this.getVideoWatchedStatuses(true);
        const localLiked = this.getVideoLikedStatuses(true);

        // Серверные данные приоритетнее
        const mergedWatched = { ...localWatched };
        Object.keys(serverData.watched || {}).forEach(id => {
          mergedWatched[id] = 'watched';
        });
        Object.keys(serverData.watchLater || {}).forEach(id => {
          mergedWatched[id] = 'watch_later';
        });

        const mergedLiked = { ...localLiked };
        Object.keys(serverData.liked || {}).forEach(id => {
          mergedLiked[id] = 'liked';
        });
        Object.keys(serverData.disliked || {}).forEach(id => {
          mergedLiked[id] = 'disliked';
        });

        this.setVideoWatchedStatuses(mergedWatched, true);
        this.setVideoLikedStatuses(mergedLiked, true);
      }
    } catch (error) {
      console.error('Failed to sync from server:', error);
    }
  }

  /**
   * Сохранить статус видео с синхронизацией
   */
  static async setVideoStatusWithSync(
    videoId: string,
    status: 'watched' | 'watch_later' | 'liked' | 'disliked',
    isLoggedIn: boolean
  ): Promise<void> {
    // Сохраняем локально сразу
    if (status === 'watched' || status === 'watch_later') {
      const statuses = this.getVideoWatchedStatuses(isLoggedIn);
      statuses[videoId] = status;
      this.setVideoWatchedStatuses(statuses, isLoggedIn);
    } else {
      const statuses = this.getVideoLikedStatuses(isLoggedIn);
      statuses[videoId] = status;
      this.setVideoLikedStatuses(statuses, isLoggedIn);
    }

    // Синхронизируем с сервером если авторизован
    if (isLoggedIn) {
      try {
        await fetch(`${this.API_BASE}/video-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId, status }),
        });
      } catch (error) {
        console.error('Failed to sync video status:', error);
        // Данные уже сохранены локально, синхронизация повторится позже
      }
    }
  }
}
```

---

## 4. Итоговая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                         КЛИЕНТ                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Гость                        Пользователь                  │
│   ┌──────────────┐            ┌──────────────┐             │
│   │ localStorage │            │ localStorage │◄────┐       │
│   │ + IndexedDB  │            │ + IndexedDB  │     │       │
│   └──────────────┘            └──────────────┘     │       │
│                                      │             │       │
│                                      ▼             │       │
│                               ┌──────────────┐     │       │
│                               │   Синхрон-   │     │       │
│                               │   изация     │─────┘       │
│                               └──────────────┘             │
│                                      │                     │
└──────────────────────────────────────┼─────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│                         СЕРВЕР                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐    ┌──────────────────────────────┐     │
│   │ JWT Auth     │───►│ UserData API                 │     │
│   │ Middleware   │    │ • /video-status              │     │
│   └──────────────┘    │ • /favorites                 │     │
│                       │ • /watch-history             │     │
│                       └──────────────────────────────┘     │
│                                      │                     │
│                                      ▼                     │
│                       ┌──────────────────────────────┐     │
│                       │     SQLite / PostgreSQL      │     │
│                       │  • UserFavorite              │     │
│                       │  • WatchHistory              │     │
│                       │  • VideoStatus               │     │
│                       └──────────────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Преимущества системы

| Аспект                      | Гость           | Пользователь      |
| --------------------------- | --------------- | ----------------- |
| Просмотр контента           | ✅              | ✅                |
| Сохранение истории          | Только локально | Локально + Сервер |
| Избранное                   | ❌              | ✅                |
| Доступ с разных устройств   | ❌              | ✅                |
| Сохранение при очистке кэша | ❌              | ✅                |
| Резервное копирование       | ❌              | ✅                |

---

## 6. План внедрения

1. **Фаза 1:** Добавить модели в Prisma схему
2. **Фаза 2:** Создать API маршруты
3. **Фаза 3:** Добавить синхронизацию на фронтенде
4. **Фаза 4:** Протестировать миграцию данных
5. **Фаза 5:** Добавить UI для управления данными

---

## 7. Связанные документы

- [AUTH_IMPLEMENTATION_PLAN.md](./AUTH_IMPLEMENTATION_PLAN.md) — план реализации аутентификации
- [DB_SCHEMA_AUTH.md](./DB_SCHEMA_AUTH.md) — схема базы данных для аутентификации
- [REST_API_AUTH.md](./REST_API_AUTH.md) — REST API для аутентификации
