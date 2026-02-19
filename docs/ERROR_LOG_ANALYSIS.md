# Анализ логов сервера Rutube Cinema Hub

## 📋 Общая информация

**Версия документа:** 2.0  
**Дата анализа:** 19 февраля 2026  
**Статус:** Актуально

## 📊 Статистика ошибок

**Источник данных:** `logs/error_logs.json`  
**Текущее состояние:** ~10,000 записей в истории логов  
**Период анализа:** Февраль 2026

### Метрики

- **Общий объем логов:** ~10,000 записей (лимит ротации: 1000)
- **Критические категории:** Прокси-запросы, React Hooks, Circuit Breaker
- **Частота:** Массовые повторы при сбоях (до 100+ ошибок подряд для одного канала)

---

## 🔴 Критические проблемы

### 1. Сбой прокси-запросов к Rutube API

**Приоритет:** 🔴 КРИТИЧЕСКИЙ  
**Влияние:** ~95% всех ошибок  
**Статус:** Требует немедленного исправления

#### Описание проблемы

Массовые сбои при выполнении прокси-запросов к Rutube API с ошибкой "All proxies failed for URL".

#### Затронутые endpoints

1. `/api/video/person/{id}/` - получение видео канала (основной источник ошибок)
2. `/channel/{id}/` - страница канала
3. `/channel/{id}/videos/` - видео канала (HTML scraping)
4. `/channel/{id}/playlists/` - плейлисты канала
5. `/api/playlist/user/{id}/` - плейлисты пользователя
6. `/api/playlist/custom/{id}/videos` - видео из плейлиста

#### Затронутые каналы

- **32869212** (Смотри кино) - большинство ошибок
- **38284124** (Твое кино)
- **33284182** (СмотретьOnline)
- **32181632** (Фильмач)
- **36921062** (Синемач)
- **26313118**

#### Причины

1. **Таймауты:**
   - Серверный таймаут: 30,000ms (по умолчанию) или 60,000ms (Docker)
   - Клиентский таймаут: 70,000ms
   - Connection timeout: 5,000ms

2. **Rate Limiting от Rutube:**
   - Возможная блокировка при частых запросах
   - Отсутствие exponential backoff

3. **Circuit Breaker слишком агрессивный:**
   - Открывается после 3 ошибок подряд
   - Блокирует запросы на 30 секунд
   - Не дает системе восстановиться при кратковременных сбоях

4. **DNS/Network failures:**
   - Ошибки resolve и connection
   - Abort signals без причины

#### Код (текущая реализация)

**Файл:** `server/routes/proxy.js:9-10`

```javascript
const REQUEST_TIMEOUT_MS = parseInt(process.env.PROXY_REQUEST_TIMEOUT_MS) || 30000;
const CONNECT_TIMEOUT_MS = 5000;
```

**Файл:** `src/services/rutubeService.ts:150-160`

```typescript
const CLIENT_PROXY_TIMEOUT_MS = 70000;
const REQUEST_THROTTLE_MS = 800;
const PROXY_RETRY_DELAY_MS = 2000;

const localProxyBreaker = new CircuitBreaker({
  failureThreshold: 3, // После 3 ошибок подряд открываем
  resetTimeout: 30000, // Ждём 30 секунд перед проверкой
});
```

#### Рекомендации по исправлению

**✅ Приоритет 1 (КРИТИЧНО):**

1. **Увеличить failureThreshold Circuit Breaker**
   - Текущее значение: 3 ошибки
   - Рекомендуемое: 5-7 ошибок
   - Обоснование: Даёт системе больше шансов на восстановление при временных сбоях

2. **Реализовать Exponential Backoff**

   ```typescript
   // Вместо фиксированного PROXY_RETRY_DELAY_MS = 2000
   const calculateBackoff = (attempt: number): number => {
     const baseDelay = 1000;
     const maxDelay = 32000;
     const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
     return delay + Math.random() * 1000; // jitter
   };
   ```

3. **Добавить дедупликацию ошибок в логгере**

   ```javascript
   // server/middleware/logging.js
   const errorCache = new Map();
   const ERROR_CACHE_TTL = 60000; // 1 минута

   const shouldLog = error => {
     const key = `${error.message}:${error.context?.targetUrl}`;
     const lastLogged = errorCache.get(key);
     if (lastLogged && Date.now() - lastLogged < ERROR_CACHE_TTL) {
       return false;
     }
     errorCache.set(key, Date.now());
     return true;
   };
   ```

4. **Увеличить REQUEST_THROTTLE_MS**
   - Текущее значение: 800ms
   - Рекомендуемое: 1500ms - 2000ms
   - Обоснование: Снижает нагрузку на Rutube API

**✅ Приоритет 2 (ВАЖНО):**

1. **Добавить healthcheck для Rutube API**

   ```typescript
   const checkRutubeHealth = async (): Promise<boolean> => {
     try {
       const res = await fetch('https://rutube.ru/api/healthcheck/', {
         timeout: 5000,
       });
       return res.ok;
     } catch {
       return false;
     }
   };
   ```

2. **Реализовать fallback на кешированные данные**
   - При Circuit Breaker OPEN показывать последние успешные данные
   - Добавить IndexedDB кеш для офлайн-режима

3. **Показывать пользователю информативные сообщения**
   - "Сервис временно недоступен, показываем кешированные данные"
   - "Rutube API перегружен, повторная попытка через X секунд"

**✅ Приоритет 3 (УЛУЧШЕНИЯ):**

1. **UI индикатор состояния Circuit Breaker**

   ```typescript
   import { getProxyStatus } from '../services/rutubeService';

   const ProxyStatusIndicator = () => {
     const status = getProxyStatus();
     if (status.state === 'OPEN') {
       return <Badge>Прокси недоступен ({status.timeUntilReset}s)</Badge>;
     }
     return null;
   };
   ```

2. **Метрики успешности запросов**
   - Добавить счётчики успешных/неуспешных запросов
   - Экспортировать метрики для мониторинга

3. **Автоматическое восстановление**
   - Постепенное увеличение частоты запросов после восстановления
   - Адаптивная регулировка throttle в зависимости от ответов API

---

### 2. React Hooks Order Violation

**Приоритет:** 🟡 ВЫСОКИЙ  
**Влияние:** Потенциальные крахи приложения  
**Статус:** Частично исправлен

#### Описание проблемы

**Ошибка:** `React has detected a change in the order of Hooks called by App`

**Локация:** `src/hooks/useAppComposition.ts` (вызывается из `App.tsx`)

**Причина:** Условный вызов хуков или изменение порядка хуков между рендерами.

#### Анализ кода

**Файл:** `src/hooks/useAppComposition.ts:248-255`

```typescript
// Safe check: channelMenuRef might be undefined in some render cycles
if (
  channelMenuRef &&
  'current' in channelMenuRef &&
  channelMenuRef.current &&
  !channelMenuRef.current.contains(target)
) {
  closeChannelMenu();
}
```

**Проблема:** Проверка `'current' in channelMenuRef` указывает на то, что `channelMenuRef` может быть `undefined` в некоторых циклах рендера, что нарушает правила хуков.

**Правило React Hooks:** Хуки должны вызываться в одном и том же порядке при каждом рендере.

#### Текущее состояние

✅ **Исправлено частично:** Добавлены безопасные проверки  
⚠️ **Остаётся риск:** Зависимость от `channelMenuRef` в `useEffect` может вызывать лишние ререндеры

#### Рекомендации по исправлению

**✅ Решение 1: Гарантировать инициализацию ref**

Проверить, что `channelMenuRef` всегда возвращается из `useChannelMenu`:

```typescript
// src/hooks/useChannelMenu.ts:60
const channelMenuRef = useRef<HTMLDivElement>(null); // ✅ Всегда инициализирован
```

**✅ Решение 2: Упростить проверку**

```typescript
// src/hooks/useAppComposition.ts:248-255
if (channelMenuRef?.current && !channelMenuRef.current.contains(target)) {
  closeChannelMenu();
}
```

**✅ Решение 3: Убрать channelMenuRef из зависимостей useEffect**

```typescript
useEffect(() => {
  // ... handlers
}, [closeChannelMenu]); // Убрать channelMenuRef из зависимостей
```

---

### 3. TypeError: Cannot read properties of undefined (reading 'current')

**Приоритет:** 🟡 ВЫСОКИЙ  
**Влияние:** Потенциальные runtime ошибки  
**Статус:** ✅ ИСПРАВЛЕНО (defensive checks добавлены)

#### Описание проблемы

**Ошибка:** `Uncaught TypeError: Cannot read properties of undefined (reading 'current')`

**Локация:** `src/hooks/useAppComposition.ts:252` (строка может меняться)

**Причина:** Попытка доступа к `.current` на `undefined` ref

#### Текущая защита

```typescript
// Добавлены проверки существования
if (
  channelMenuRef &&
  'current' in channelMenuRef &&
  channelMenuRef.current &&
  !channelMenuRef.current.contains(target)
) {
  closeChannelMenu();
}
```

#### Рекомендации

✅ **Текущее решение адекватно**, но можно упростить:

```typescript
if (channelMenuRef?.current?.contains(target) === false) {
  closeChannelMenu();
}
```

---

## ⚠️ Паттерны проблем (Anti-patterns)

### 1. Каскадные ошибки (Retry Storm)

**Проблема:** Когда один канал падает, система пытается переподключиться каждые ~1-2 секунды, генерируя десятки одинаковых ошибок.

**Пример:**

```
[08:33:42] Error: Proxy request failed for channel 32869212
[08:33:44] Error: Proxy request failed for channel 32869212
[08:33:46] Error: Proxy request failed for channel 32869212
... (x100)
```

**Решение:**

- Exponential backoff (уже описан выше)
- Circuit Breaker с более мягкими настройками
- Дедупликация ошибок в логах

### 2. Отсутствие дедупликации логов

**Проблема:** Одинаковые ошибки логируются многократно, забивая лог-файл.

**Текущий код:** `server/middleware/logging.js:14-29`

```javascript
export const writeLog = logEntry => {
  // ... logs.push() без проверки дубликатов
};
```

**Решение:** См. Приоритет 1, пункт 3 выше.

### 3. Отсутствие graceful degradation

**Проблема:** При недоступности Rutube происходит шторм retry-запросов вместо показа кешированных данных.

**Решение:**

- Кеширование ответов в IndexedDB
- Показ устаревших данных при недоступности API
- UI-индикатор состояния сервиса

---

## 📋 План исправлений (Action Plan)

### Фаза 1: Стабилизация (Неделя 1)

- [ ] Увеличить `failureThreshold` с 3 до 5-7
- [ ] Увеличить `REQUEST_THROTTLE_MS` с 800ms до 1500-2000ms
- [ ] Реализовать дедупликацию ошибок в логгере
- [ ] Добавить exponential backoff для retry

### Фаза 2: Улучшение устойчивости (Неделя 2)

- [ ] Реализовать healthcheck для Rutube API
- [ ] Добавить fallback на кешированные данные
- [ ] Улучшить UI-сообщения об ошибках
- [ ] Упростить проверки `channelMenuRef`

### Фаза 3: Мониторинг и метрики (Неделя 3)

- [ ] UI индикатор состояния Circuit Breaker
- [ ] Метрики успешности запросов
- [ ] Dashboard для мониторинга ошибок
- [ ] Автоматические алерты при превышении порога ошибок

---

## 🔧 Конфигурация (Рекомендуемая)

### Environment Variables

```bash
# server/.env
PROXY_REQUEST_TIMEOUT_MS=60000      # Увеличено с 30000
CONNECT_TIMEOUT_MS=5000
REQUEST_THROTTLE_MS=2000            # Увеличено с 800
CIRCUIT_BREAKER_THRESHOLD=7         # Увеличено с 3
CIRCUIT_BREAKER_RESET_TIMEOUT=45000 # Увеличено с 30000
```

### Circuit Breaker Settings

```typescript
// src/services/rutubeService.ts
const localProxyBreaker = new CircuitBreaker({
  failureThreshold: 7, // Было: 3
  resetTimeout: 45000, // Было: 30000
});
```

### Retry Settings

```typescript
// src/services/rutubeService.ts
const REQUEST_THROTTLE_MS = 2000; // Было: 800
const PROXY_RETRY_DELAY_MS = 2000; // Базовый (будет экспоненциальным)
const CLIENT_PROXY_TIMEOUT_MS = 70000; // Без изменений
```

---

## 📈 Ожидаемые результаты

После внедрения всех рекомендаций:

1. **Снижение количества ошибок на 70-80%**
   - Меньше ложных срабатываний Circuit Breaker
   - Меньше retry storms

2. **Улучшение пользовательского опыта**
   - Показ кешированных данных при сбоях
   - Информативные сообщения об ошибках
   - Видимость состояния системы

3. **Улучшение observability**
   - Метрики для мониторинга
   - Дедуплицированные логи
   - Алерты при критических сбоях

---

## 📚 Связанные документы

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Архитектура приложения
- [PROXY_SECURITY.md](./PROXY_SECURITY.md) - Безопасность прокси
- [PERFORMANCE.md](./PERFORMANCE.md) - Оптимизация производительности
- [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) - Управление состоянием

---

## 📝 История изменений

| Версия | Дата       | Автор    | Изменения                          |
| ------ | ---------- | -------- | ---------------------------------- |
| 2.0    | 2026-02-19 | AI Agent | Улучшенный анализ с рекомендациями |
| 1.0    | 2026-02-14 | User     | Первоначальный анализ логов        |
