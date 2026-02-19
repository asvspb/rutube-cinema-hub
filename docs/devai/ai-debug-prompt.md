# Промпт для анализа проблем прокси-сервера Rutube Cinema Hub

## Контекст проекта

**Проект:** Rutube Cinema Hub — веб-приложение для агрегации видеоконтента с Rutube.

**Архитектура:**

```
┌─────────────────────────────────────────────────────────────────┐
│                         Docker Compose                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐       ┌──────────────────────┐        │
│  │   Frontend (Vite)    │       │   Backend (Express)  │        │
│  │   Port: 9229         │──────▶│   Port: 9230         │        │
│  │                      │  /api │                      │        │
│  │   React + TypeScript │       │   Node.js Proxy      │        │
│  │   Vite Dev Server    │       │                      │        │
│  └──────────────────────┘       └──────────┬───────────┘        │
│                                            │                    │
│                                            ▼                    │
│                                 ┌──────────────────────┐        │
│                                 │   Rutube API         │        │
│                                 │   rutube.ru          │        │
│                                 │   (external)         │        │
│                                 └──────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Проблема

При работе приложения в Docker наблюдаются множественные ошибки:

### 1. Рекурсия в логировании

**Логи:**

```
[CLIENT LOG] { level: 'error', message: 'Console error', context: { args: [ 'Failed to send log to server:', [Object] ] } }
[CLIENT LOG] { level: 'error', message: 'Console error', context: { args: [ 'Failed to send log to server:', [Object] ] } }
... (повторяется многократно)
```

**Код клиента (src/services/loggerService.ts):**

```typescript
class Logger {
  private async send(entry: LogEntry, options: { skipConsole?: boolean } = {}) {
    try {
      // ... отправка на /api/logs
    } catch (e) {
      // ПРОБЛЕМА: console.error триггерит патченный console.error
      console.error('Failed to send log to server:', e);
    }
  }

  initConsoleCapture() {
    console.error = (...args: unknown[]) => {
      this.originalConsole.error(...args);
      this.send({ level: 'error', message: 'Console error', ... });
    };
  }
}
```

### 2. Таймаут прокси при запросах к Rutube

**Логи:**

```
[CLIENT LOG] { level: 'warn', message: 'Local proxy timeout, marking as down',
  targetUrl: 'https://rutube.ru/api/video/person/32869212/?_=...&client=android&format=json&page=4' }
```

**Код клиента (src/services/rutubeService.ts):**

```typescript
const fetchTextWithRace = async (targetUrl: string, options?: { signal?: AbortSignal }) => {
  const proxies = getProxies();
  // local proxy first: /api/proxy?url=...
  // fallback: direct https://rutube.ru/...

  const timeoutMs = isLocal ? 15000 : 10000; // 15s для локального прокси, 10s для прямых
  // ...

  // При таймауте:
  if (isLocal) {
    localProxyStatus = 'down';
    logger.warn('Local proxy timeout, marking as down', { targetUrl });
  }
};
```

**Код сервера (server/routes/proxy.js):**

```javascript
const REQUEST_TIMEOUT_MS = parseInt(process.env.PROXY_REQUEST_TIMEOUT_MS) || 30000;
const CONNECT_TIMEOUT_MS = 5000;

const makeRequest = async (urlString, options, maxRetries = 2) => {
  // DNS resolve с IPv4
  const ipv4Address = await dnsLookup(parsedUrl.hostname, { family: 4 });

  // HTTPS request с timeout
  // ...
};
```

### 3. Полный отказ всех прокси

**Логи:**

```
[CLIENT LOG] { level: 'error', message: 'All proxies failed for URL',
  targetUrl: 'https://rutube.ru/channel/32869212/' }
[CLIENT LOG] { level: 'error', message: 'All proxies failed for URL',
  targetUrl: 'https://rutube.ru/api/playlist/user/32869212/?...' }
[CLIENT LOG] { level: 'error', message: 'All proxies failed for URL',
  targetUrl: 'https://rutube.ru/api/video/person/32869212/?...' }
```

**Код клиента:**

```typescript
const getProxies = () => {
  const proxies = [];
  if (localProxyStatus !== 'down') {
    proxies.push((target: string) => `/api/proxy?url=${encodeURIComponent(target)}`);
  }
  proxies.push((target: string) => target); // прямой запрос
  return proxies;
};
```

## Конфигурация

**docker-compose.yml:**

```yaml
services:
  frontend:
    environment:
      VITE_PROXY_TARGET: http://backend:9230
    dns:
      - 8.8.8.8
      - 1.1.1.1
    depends_on:
      - backend

  backend:
    environment:
      PROXY_CONNECT_TIMEOUT_MS: '30000'
      PROXY_REQUEST_TIMEOUT_MS: '60000'
    dns:
      - 8.8.8.8
      - 1.1.1.1
```

**vite.config.ts:**

```typescript
server: {
  port: 9229,
  proxy: {
    '/api': {
      target: process.env.VITE_PROXY_TARGET || 'http://localhost:9230',
      changeOrigin: true,
    },
  },
}
```

## Взаимосвязи проблем

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ЦЕПОЧКА ОТКАЗОВ                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Backend делает запрос к Rutube API                               │
│     └─▶ DNS resolve (8.8.8.8) ─▶ IPv4 address                        │
│     └─▶ HTTPS request (timeout 30-60s)                               │
│                                                                      │
│  2. Запрос зависает или таймаутит                                     │
│     └─▶ Причина: сеть/Docker/Rutube блокировка?                      │
│                                                                      │
│  3. Frontend ждёт ответ 15s, затем помечает прокси как 'down'        │
│     └─▶ localProxyStatus = 'down'                                    │
│                                                                      │
│  4. Frontend пытается прямой запрос к Rutube                         │
│     └─▶ CORS блокировка в браузере                                   │
│     └─▶ Или Cloudflare protection                                    │
│                                                                      │
│  5. Все прокси failed                                                │
│     └─▶ logger.error('All proxies failed...')                        │
│                                                                      │
│  6. Logger пытается отправить лог на сервер                          │
│     └─▶ fetch('/api/logs', ...)                                      │
│     └─▶ Возможно тоже таймаутит или fails                            │
│                                                                      │
│  7. catch(e) → console.error('Failed to send log...')                │
│     └─▶ Патченный console.error вызывает send()                      │
│     └─▶ РЕКУРСИЯ! 🔄                                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Вопросы для анализа

1. **Рекурсия в логировании:**
   - Как правильно разорвать цикл console.error → send → console.error?
   - Нужно ли использовать флаг `isSending` или другой подход?
   - Должен ли `console.error` в catch-блоке использовать `originalConsole.error`?

2. **Таймауты прокси:**
   - Почему 15s на клиенте меньше чем 30-60s на сервере?
   - Должны ли таймауты синхронизироваться?
   - Как правильно обработать ситуацию, когда сервер работает медленно?

3. **Прямые запросы к Rutube:**
   - Имеет ли смысл fallback на прямые запросы из браузера?
   - CORS и Cloudflare делают это практически невозможным?
   - Может быть лучше вернуть ошибку сразу?

4. **Статус прокси:**
   - Правильно ли помечать прокси как 'down' на один таймаут?
   - Нужен ли механизм восстановления (health check)?
   - Как избежать "self-inflicted DoS" когда все прокси помечены как down?

5. **Docker-специфика:**
   - Может ли проблема быть в DNS в Alpine-контейнере?
   - Нужен ли IPv6 fallback?
   - Может ли Rutube блокировать IP Docker-хоста?

6. **Архитектура:**
   - Нужен ли retry с экспоненциальным backoff?
   - Стоит ли добавить кэширование ответов?
   - Нужен ли circuit breaker паттерн?

## Ожидаемый результат

Предложите конкретные изменения в коде для:

1. Исправления рекурсии в loggerService.ts
2. Улучшения обработки таймаутов и ошибок
3. Добавления механизма восстановления прокси
4. Оптимизации fallback-стратегии

Приложите diff-патчи или полные исправленные фрагменты кода.
