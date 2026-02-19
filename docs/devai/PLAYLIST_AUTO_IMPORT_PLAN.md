# План: Автоматическая загрузка и отображение плейлистов каналов

**Дата создания:** 2026-02-19  
**Статус:** План готов к реализации  
**Приоритет:** Средний

---

## 1. Текущая Архитектура

### 1.1 Существующие функции в `rutubeService.ts`

#### `fetchChannelInfo(rutubeId)` (строки 1029-1138)

Получает метаинформацию о канале:

- `title` — название канала
- `subscribers` — количество подписчиков (форматированное)
- `avatarUrl` — URL аватара
- `bannerUrl` — URL баннера
- `videoCount` — общее количество видео

**Стратегия:** Парсинг HTML страницы канала + извлечение JSON из `window.reduxState`

#### `fetchChannelPlaylists(rutubeId)` (строки 863-973)

Получает список плейлистов канала:

- Возвращает массив `CategoryDef[]`
- Поддерживает пагинацию (до 10 страниц API)
- Fallback на HTML-скрапинг если API не отдает данные
- Дедупликация по `rutubeId`

**Эндпоинты:**

1. API: `${BASE_API}/playlist/user/${rutubeId}/?client=android&format=json`
2. HTML: `https://rutube.ru/channel/${rutubeId}/playlists/`
3. Fallback: `https://rutube.ru/u/${rutubeId}/playlists/`

**Извлекаемая информация:**

- `id` — внутренний ID (генерируется)
- `label` — название плейлиста
- `rutubeId` — ID плейлиста на Rutube
- `itemCount` — количество видео (если доступно)

---

### 1.2 Текущий процесс при добавлении канала

**Файл:** `src/components/AddChannelModal.tsx` (строки 22-67)

```typescript
handleSubmit → parseRutubeUrl → resolveRutubeId → fetchChannelInfo (опционально)
```

**Что происходит:**

1. Пользователь вводит URL канала
2. URL парсится и валидируется
3. Извлекается `rutubeId` (с резолвом для username-based URLs)
4. **Опционально:** Если имя не указано, вызывается `fetchChannelInfo()` для автозаполнения
5. Канал добавляется с одной системной категорией "Все видео"

**Файл:** `src/hooks/useChannels.ts` (строки 107-132)

```typescript
const handleAddChannel = (name: string, rutubeId: string) => {
  const newChannelId = `channel-${rutubeId}-${Date.now()}`;
  const newChannel: ChannelDef = {
    id: newChannelId,
    label: name,
    rutubeId,
    isSystem: false,
  };

  // Создается только одна категория "Все видео"
  const initialPlaylists: CategoryDef[] = [
    {
      id: `all-${newChannelId}`,
      label: 'Все видео',
      rutubeId: rutubeId,
      type: 'channel',
      isSystem: true,
    },
  ];

  setChannels(prev => [...prev, newChannel]);
  setAllPlaylists(prev => ({ ...prev, [newChannelId]: initialPlaylists }));
  handleChannelSelect(newChannelId);
};
```

---

### 1.3 Текущий процесс загрузки при выборе канала

**Файл:** `src/hooks/useAppComposition.ts` (строки 185-188)

```typescript
useEffect(() => {
  if (viewMode === 'channel' && activeChannelId) {
    refreshChannelData();
  }
}, [activeChannelId, viewMode, refreshChannelData]);
```

**Файл:** `src/hooks/useChannels.ts` (строки 154-258)

`refreshChannelData()` выполняет:

1. ✅ `fetchChannelInfo(channel.rutubeId)` — загрузка метаданных
2. ✅ `fetchChannelPlaylists(channel.rutubeId)` — загрузка списка плейлистов
3. ✅ Сохранение в `channelAvailablePlaylists` (для модального окна импорта)
4. ✅ Обновление `itemCount` для существующих категорий

**Важно:** Плейлисты загружаются, но **не добавляются автоматически** в меню канала.

---

### 1.4 Текущий процесс импорта плейлистов (ручной)

**Триггер:** Пользователь нажимает "Импорт плейлистов" в меню канала

**Файл:** `src/components/UIComponents.tsx` (строки 417-434)

```typescript
<button onClick={() => {
  if (activeMenuChannel) {
    setChannelToImport(activeMenuChannel);
  }
  closeChannelMenu();
}}>
  <ListPlus className="w-4 h-4" />
  <span>Импорт плейлистов</span>
  <span className="ml-auto text-xs">
    {isChannelLoading ? '...' : channelAvailablePlaylists.length}
  </span>
</button>
```

**Файл:** `src/components/ImportPlaylistsModal.tsx` (строки 16-23)

```typescript
interface ImportPlaylistsModalProps {
  onClose: () => void;
  onImport: (playlists: CategoryDef[]) => void;
  onManualAdd: () => void;
  channelId: string;
  existingPlaylists: CategoryDef[];
  preloadedPlaylists?: CategoryDef[]; // ✅ Поддержка предзагрузки!
}
```

**Логика модального окна:**

1. Если передан `preloadedPlaylists` → использует их
2. Если нет → вызывает `fetchChannelPlaylists(channelId)` заново
3. Пользователь выбирает плейлисты чекбоксами
4. Нажимает "Импортировать N плейлистов"
5. Плейлисты добавляются в `allPlaylists[channelId]`

**Badge с количеством плейлистов:**

- Отображается в меню канала справа от кнопки
- Показывает количество доступных плейлистов
- Данные берутся из `channelAvailablePlaylists`

---

## 2. Проблемы текущей реализации

### 2.1 UX-проблемы

❌ **Плейлисты не видны сразу**

- Пользователь добавляет канал, но видит только "Все видео"
- Нужно явно открыть меню → "Импорт плейлистов" → выбрать → импортировать
- Новые пользователи могут не знать о существовании плейлистов

❌ **Дублирование запросов**

- `refreshChannelData()` загружает плейлисты при выборе канала
- `ImportPlaylistsModal` повторно загружает плейлисты при открытии (если `preloadedPlaylists` не передан)

❌ **Badge с числом плейлистов скрыт в меню**

- Видно только после открытия меню канала
- Нет визуальной индикации "есть что импортировать"

### 2.2 Технические проблемы

❌ **Нет кэширования плейлистов**

- Каждый раз загружаются заново при открытии модального окна
- Данные не сохраняются в `IndexedDB` / `LocalStorage`

❌ **Нет обработки обновлений**

- Если автор канала добавил новый плейлист, пользователь не узнает об этом
- Нет механизма "Обновить список плейлистов"

❌ **Race condition при быстром переключении каналов**

- Частично решено через `refreshRequestIdRef` (строки 48, 164-200 в `useChannels.ts`)
- Но данные плейлистов могут устареть

---

## 3. Анализ возможных вариантов реализации

### Вариант A: Автозагрузка при добавлении канала

**Идея:** При добавлении канала сразу загружать плейлисты и добавлять их все в меню

**Реализация:**

```typescript
const handleAddChannel = async (name: string, rutubeId: string) => {
  const newChannelId = `channel-${rutubeId}-${Date.now()}`;

  // 1. Создаем канал
  const newChannel: ChannelDef = { id: newChannelId, label: name, rutubeId, isSystem: false };

  // 2. Загружаем плейлисты
  const playlists = await fetchChannelPlaylists(rutubeId);

  // 3. Создаем "Все видео" + все плейлисты
  const allCategories = [
    { id: `all-${newChannelId}`, label: 'Все видео', rutubeId, type: 'channel', isSystem: true },
    ...playlists,
  ];

  setChannels(prev => [...prev, newChannel]);
  setAllPlaylists(prev => ({ ...prev, [newChannelId]: allCategories }));
  handleChannelSelect(newChannelId);
};
```

**✅ Плюсы:**

- Пользователь сразу видит все плейлисты
- Не нужно вручную импортировать
- Лучший UX для новых пользователей

**❌ Минусы:**

- Может быть медленно для каналов с >50 плейлистами
- Загрязняет меню ненужными плейлистами
- Нельзя выбрать, какие плейлисты импортировать

**📊 Оценка:** Подходит для простых use-cases, но теряет гибкость

---

### Вариант B: Фоновая загрузка при первом выборе канала (текущая реализация)

**Идея:** При выборе канала загружать плейлисты в фоне и сохранять в `channelAvailablePlaylists`

**Реализация:** Уже есть в `refreshChannelData()` (строки 186-214)

**✅ Плюсы:**

- Быстрое добавление канала
- Ленивая загрузка
- Не загружает лишние данные до выбора канала

**❌ Минусы:**

- Плейлисты невидимы до открытия меню
- Нет визуальной индикации "новые плейлисты доступны"

**📊 Оценка:** Текущая реализация. Нужно улучшить видимость.

---

### Вариант C: Badge-индикатор с количеством + кнопка "Загрузить плейлисты"

**Идея:** Показывать badge на кнопке канала с количеством доступных плейлистов

**Реализация:**

```typescript
// В Navigation.tsx
<button onClick={() => handleChannelSelect(channel.id)}>
  {channel.label}
  {channelAvailablePlaylists.length > 0 && (
    <span className="badge">{channelAvailablePlaylists.length}</span>
  )}
</button>
```

**✅ Плюсы:**

- Явный визуальный индикатор
- Не загружает лишние плейлисты автоматически
- Сохраняет контроль пользователя

**❌ Минусы:**

- Требует дополнительного клика
- Badge может быть не замечен

**📊 Оценка:** Хороший компромисс между автоматизацией и контролем

---

### Вариант D: Автоматический импорт первых N популярных плейлистов

**Идея:** Автоматически добавлять первые 3-5 плейлистов, остальные через "Импорт"

**Реализация:**

```typescript
const handleAddChannel = async (name: string, rutubeId: string) => {
  const playlists = await fetchChannelPlaylists(rutubeId);

  // Автоматически добавляем первые 3
  const autoImport = playlists.slice(0, 3);

  const allCategories = [
    { id: `all-${newChannelId}`, label: 'Все видео', rutubeId, type: 'channel', isSystem: true },
    ...autoImport,
  ];

  // Остальные доступны через импорт
  setChannelAvailablePlaylists(playlists.slice(3));
};
```

**✅ Плюсы:**

- Баланс между автоматизацией и контролем
- Не перегружает меню
- Сразу показывает основные плейлисты

**❌ Минусы:**

- Как определить "популярные"? (API не всегда возвращает `video_count`)
- Может пропустить важные плейлисты

**📊 Оценка:** Хорошо для каналов с >10 плейлистами

---

## 4. Рекомендуемое решение: Гибридный подход

### 4.1 Стратегия

**Этап 1: При добавлении канала**

- ❌ НЕ загружать плейлисты сразу
- ✅ Создать только "Все видео"
- Причина: Быстрое добавление, не блокируем UI

**Этап 2: При первом выборе канала**

- ✅ `refreshChannelData()` загружает `channelInfo` + `channelAvailablePlaylists`
- ✅ Данные сохраняются в state (уже реализовано)
- ✅ Обновляем `itemCount` для существующих категорий

**Этап 3: Визуальная индикация**

- ✅ Показать badge на кнопке меню канала с количеством доступных плейлистов
- ✅ Анимация "pulse" при первой загрузке
- ✅ Tooltip: "N плейлистов доступно для импорта"

**Этап 4: Упрощенный импорт**

- ✅ Кнопка "Импортировать все" в модальном окне
- ✅ Группировка плейлистов по категориям (если доступно)
- ✅ Фильтр/поиск по названию плейлиста

**Этап 5: Кэширование и обновление**

- ✅ Сохранять `channelAvailablePlaylists` в `LocalStorage`
- ✅ Кнопка "Обновить список плейлистов" в меню канала
- ✅ TTL: 24 часа (автообновление при истечении)

---

### 4.2 Детальный план реализации

#### Задача 1: Добавить badge-индикатор в меню канала

**Файл:** `src/components/UIComponents.tsx`

**Изменения:**

```typescript
// Строка 417-434 → Добавить визуальный badge
<button onClick={() => { ... }}>
  <ListPlus className="w-4 h-4" />
  <span>Импорт плейлистов</span>

  {/* ✅ НОВОЕ: Более заметный badge */}
  {channelAvailablePlaylists.length > 0 && (
    <span className="ml-auto flex items-center gap-1">
      <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
        {channelAvailablePlaylists.length}
      </span>
      {!isChannelLoading && channelAvailablePlaylists.length > 5 && (
        <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
      )}
    </span>
  )}
</button>
```

**Цель:** Сделать badge более заметным, добавить анимацию для большого количества плейлистов

---

#### Задача 2: Кнопка "Импортировать все" в модальном окне

**Файл:** `src/components/ImportPlaylistsModal.tsx`

**Изменения:**

```typescript
// После строки 98 (функция toggleAll)
const importAllAvailable = () => {
  const availablePlaylists = playlists.filter(p => !isAlreadyAdded(p.rutubeId));
  const allIds = new Set(availablePlaylists.map(p => p.rutubeId));
  setSelectedIds(allIds);
};

// В UI (после кнопки "Выбрать все")
<button
  onClick={importAllAvailable}
  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
>
  <Plus className="w-4 h-4 inline mr-1" />
  Импортировать все ({playlists.filter(p => !isAlreadyAdded(p.rutubeId)).length})
</button>
```

---

#### Задача 3: Кэширование плейлистов в LocalStorage

**Файл:** `src/services/storageService.ts`

**Новые методы:**

```typescript
// Схема кэша
interface PlaylistCache {
  channelId: string;
  playlists: CategoryDef[];
  timestamp: number;
  ttl: number; // 24 hours in ms
}

class StorageService {
  // ...existing code...

  static setChannelPlaylistsCache(channelId: string, playlists: CategoryDef[]): void {
    const cache: PlaylistCache = {
      channelId,
      playlists,
      timestamp: Date.now(),
      ttl: 24 * 60 * 60 * 1000,
    };
    localStorage.setItem(`playlists_cache_${channelId}`, JSON.stringify(cache));
  }

  static getChannelPlaylistsCache(channelId: string): CategoryDef[] | null {
    const cached = localStorage.getItem(`playlists_cache_${channelId}`);
    if (!cached) return null;

    try {
      const cache: PlaylistCache = JSON.parse(cached);
      const isExpired = Date.now() - cache.timestamp > cache.ttl;

      if (isExpired) {
        localStorage.removeItem(`playlists_cache_${channelId}`);
        return null;
      }

      return cache.playlists;
    } catch {
      return null;
    }
  }

  static invalidatePlaylistsCache(channelId: string): void {
    localStorage.removeItem(`playlists_cache_${channelId}`);
  }
}
```

**Использование в `useChannels.ts`:**

```typescript
const refreshChannelData = useCallback(async () => {
  // ...existing code...

  // Сначала проверяем кэш
  const cachedPlaylists = StorageService.getChannelPlaylistsCache(channel.rutubeId);

  if (cachedPlaylists) {
    setChannelAvailablePlaylists(cachedPlaylists);
  }

  // Затем загружаем свежие данные в фоне
  const [info, fetchedPlaylists] = await Promise.all([
    fetchChannelInfo(channel.rutubeId),
    fetchChannelPlaylists(channel.rutubeId),
  ]);

  // Обновляем кэш
  StorageService.setChannelPlaylistsCache(channel.rutubeId, fetchedPlaylists);
  setChannelAvailablePlaylists(fetchedPlaylists);
}, [viewMode, activeChannelId]);
```

---

#### Задача 4: Кнопка "Обновить плейлисты" в меню канала

**Файл:** `src/components/UIComponents.tsx`

**Изменения:**

```typescript
// После кнопки "Импорт плейлистов"
<button
  onClick={async () => {
    if (activeMenuChannel) {
      StorageService.invalidatePlaylistsCache(activeMenuChannel.rutubeId);
      refreshChannelData(); // Force refresh
    }
    closeChannelMenu();
  }}
  className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800"
>
  <RefreshCw className="w-4 h-4 text-zinc-400" />
  <span>Обновить плейлисты</span>
</button>
```

---

#### Задача 5: Поиск/фильтр в модальном окне импорта

**Файл:** `src/components/ImportPlaylistsModal.tsx`

**Новый state:**

```typescript
const [searchQuery, setSearchQuery] = useState('');

const filteredPlaylists = useMemo(() => {
  if (!searchQuery) return playlists;
  return playlists.filter(p => p.label.toLowerCase().includes(searchQuery.toLowerCase()));
}, [playlists, searchQuery]);
```

**UI:**

```typescript
// Перед списком плейлистов
<div className="p-4 border-b border-zinc-800">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
    <input
      type="text"
      value={searchQuery}
      onChange={e => setSearchQuery(e.target.value)}
      placeholder="Поиск плейлистов..."
      className="w-full pl-10 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
    />
    {searchQuery && (
      <button
        onClick={() => setSearchQuery('')}
        className="absolute right-2 top-1/2 -translate-y-1/2"
      >
        <X className="w-4 h-4 text-zinc-500" />
      </button>
    )}
  </div>
  <p className="text-xs text-zinc-500 mt-2">
    Найдено: {filteredPlaylists.length} из {playlists.length}
  </p>
</div>
```

---

## 5. План внедрения (поэтапно)

### Фаза 1: Минимальные улучшения (1-2 часа)

- ✅ Задача 1: Улучшить badge в меню канала
- ✅ Задача 2: Кнопка "Импортировать все"

### Фаза 2: Кэширование (2-3 часа)

- ✅ Задача 3: Реализовать кэш плейлистов
- ✅ Задача 4: Кнопка "Обновить плейлисты"

### Фаза 3: Улучшенный UX (1-2 часа)

- ✅ Задача 5: Поиск/фильтр в модальном окне
- ✅ Сортировка плейлистов по `itemCount` (популярные сверху)

### Фаза 4: Продвинутые функции (опционально)

- Группировка плейлистов по категориям
- Превью видео из плейлиста при наведении
- Автообновление при истечении TTL

---

## 6. Тестирование

### 6.1 Unit Tests

- `storageService.test.ts` — тесты кэширования
- `useChannels.test.ts` — тесты `refreshChannelData` с кэшем

### 6.2 Integration Tests

- Добавление канала → проверка загрузки плейлистов
- Импорт плейлистов → проверка добавления в меню
- Обновление плейлистов → проверка инвалидации кэша

### 6.3 E2E Tests (Playwright)

- `channel-playlists.spec.ts`:
  - Добавить канал
  - Открыть меню → "Импорт плейлистов"
  - Проверить badge с количеством
  - Импортировать все
  - Проверить наличие в меню

---

## 7. Метрики успеха

### Производительность

- ⏱️ Время загрузки плейлистов: <2 сек
- 💾 Размер кэша: <100KB на канал
- 🔄 Количество дублирующих запросов: 0

### UX

- 👁️ Видимость плейлистов: badge должен быть замечен >80% пользователей
- 🎯 Импорт плейлистов: снижение кликов на 50% (через "Импортировать все")
- ⚡ Скорость импорта: <1 сек на 50 плейлистов

---

## 8. Риски и митигация

### Риск 1: API Rutube может не возвращать плейлисты

**Митигация:** Fallback на HTML-скрапинг (уже реализовано)

### Риск 2: Каналы с >100 плейлистами могут перегрузить UI

**Митигация:**

- Пагинация в модальном окне импорта
- Виртуализация списка (react-window)
- Предупреждение при импорте >50 плейлистов

### Риск 3: Кэш может устареть

**Митигация:**

- TTL 24 часа
- Кнопка "Обновить" для принудительного обновления
- Индикатор "Обновлено X часов назад"

---

## 9. Дальнейшие улучшения (Future Work)

### 9.1 Умный импорт

- Анализ названий плейлистов через LLM
- Автоопределение категорий (фильмы, сериалы, мультфильмы)
- Рекомендации: "Похоже, этот плейлист содержит фильмы про космос"

### 9.2 Синхронизация между устройствами

- Экспорт/импорт конфигурации каналов + плейлистов
- JSON-формат для бэкапа

### 9.3 Уведомления о новых плейлистах

- Проверка при каждом визите
- Badge "NEW" на кнопке канала

---

## 10. Связанные документы

- `ARCHITECTURE.md` — общая архитектура проекта
- `STATE_MANAGEMENT.md` — управление состоянием
- `docs/adr/001-use-multi-strategy-data-fetching-from-rutube.md` — стратегии загрузки данных

---

## 11. Changelog

| Дата       | Автор   | Изменение                                     |
| ---------- | ------- | --------------------------------------------- |
| 2026-02-19 | RovoDev | Создание плана на основе анализа кодовой базы |
