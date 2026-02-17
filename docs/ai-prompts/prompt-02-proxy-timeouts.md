# Промпт 2: Таймауты и fallback в Proxy Service

## Технологический стек

- **Язык:** TypeScript (клиент) / JavaScript (сервер)
- **Среда:** Browser + Node.js (Docker)
- **Фреймворк:** React 18 + Vite (клиент) / Express 5 (сервер)

## Цель кода

Система проксирования запросов к Rutube API должна:

1. Проксировать запросы через backend (обход CORS)
2. Иметь fallback на прямые запросы при недоступности прокси
3. Корректно обрабатывать таймауты
4. Иметь механизм пометки прокси как "down" и восстановления

## Симптомы

```
[CLIENT LOG] { level: 'warn', message: 'Local proxy timeout, marking as down',
  targetUrl: 'https://rutube.ru/api/video/person/32869212/?...' }
[CLIENT LOG] { level: 'error', message: 'All proxies failed for URL',
  targetUrl: 'https://rutube.ru/channel/32869212/' }
```

## Код для анализа

### Клиент (src/services/rutubeService.ts)

```typescript
type ProxyStatus = 'unknown' | 'up' | 'down';
let localProxyStatus: ProxyStatus = 'unknown';

const REQUEST_THROTTLE_MS = 800;
const PROXY_RETRY_DELAY_MS = 1500;

const getProxies = () => {
  const proxies: Array<(target: string) => string> = [];
  // Всегда пробуем локальный прокси первым если не явно down
  if (localProxyStatus !== 'down') {
    proxies.push((target: string) => `/api/proxy?url=${encodeURIComponent(target)}`);
  }
  // Fallback: прямой HTTPS запрос как последнее средство
  proxies.push((target: string) => target);
  return proxies;
};

const fetchTextWithRace = async (
  targetUrl: string,
  options?: { signal?: AbortSignal }
): Promise<string> => {
  const proxies = getProxies();
  if (proxies.length === 0) {
    throw new Error('No proxies available');
  }

  let lastError: Error | undefined;

  for (const proxyGen of proxies) {
    const url = proxyGen(targetUrl);
    const isLocal = !/^https?:\/\//.test(url);
    // Reduced timeouts: 15s for local proxy, 10s for direct requests
    const timeoutMs = isLocal ? 15000 : 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      await scheduleRequestSlot();
      const res = await fetch(url, { signal: compositeSignal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        if (res.status === 429) {
          await wait(PROXY_RETRY_DELAY_MS);
        }
        lastError = new Error(`Status ${res.status}`);
        continue;
      }

      const text = await res.text();
      if (text.length > 20 && !text.includes('Proxy Error')) {
        if (isLocal) localProxyStatus = 'up';
        return text;
      }
      lastError = new Error('Proxy error or empty');
    } catch (e) {
      clearTimeout(timeoutId);
      if (e instanceof Error && e.name === 'AbortError') {
        // Mark local proxy as down on timeout
        if (isLocal) {
          localProxyStatus = 'down';
          logger.warn('Local proxy timeout, marking as down', { targetUrl });
        }
        await wait(PROXY_RETRY_DELAY_MS);
      }
      lastError = e instanceof Error ? e : new Error('Proxy fetch failed');
    }
  }

  logger.error('All proxies failed for URL', { targetUrl });
  throw lastError ?? new Error('All proxies failed');
};
```

### Сервер (server/routes/proxy.js)

```javascript
const REQUEST_TIMEOUT_MS = parseInt(process.env.PROXY_REQUEST_TIMEOUT_MS) || 30000;
const CONNECT_TIMEOUT_MS = 5000;

const makeRequest = async (urlString, options, maxRetries = 2) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const parsedUrl = new URL(urlString);

      // Resolve hostname to IPv4 with timeout
      const ipv4Address = await Promise.race([
        dnsLookup(parsedUrl.hostname, { family: 4 }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('DNS timeout')), CONNECT_TIMEOUT_MS)
        ),
      ]);

      const result = await Promise.race([
        new Promise((resolve, reject) => {
          const reqOptions = {
            hostname: ipv4Address.address,
            port: parsedUrl.port || 443,
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: { ...options.headers, Host: parsedUrl.hostname },
            timeout: REQUEST_TIMEOUT_MS,
          };

          const req = https.request(reqOptions, res => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
              resolve({
                status: res.statusCode,
                headers: res.headers,
                body: Buffer.concat(chunks),
              });
            });
          });

          req.on('error', reject);
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });
          req.end();
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Connection timeout')),
            CONNECT_TIMEOUT_MS + REQUEST_TIMEOUT_MS
          )
        ),
      ]);

      return result;
    } catch (e) {
      lastError = e;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }

  throw lastError;
};
```

### Docker Compose конфигурация

```yaml
services:
  frontend:
    environment:
      VITE_PROXY_TARGET: http://backend:9230
    dns:
      - 8.8.8.8
      - 1.1.1.1

  backend:
    environment:
      PROXY_CONNECT_TIMEOUT_MS: '30000'
      PROXY_REQUEST_TIMEOUT_MS: '60000'
    dns:
      - 8.8.8.8
      - 1.1.1.1
```

## Вопросы

1. **Рассинхрон таймаутов:**
   - Клиент: 15s для локального прокси
   - Сервер: 30-60s для запроса к Rutube
   - Почему клиент "обрывает" соединение раньше сервера?

2. **Fallback на прямые запросы:**
   - Имеет ли смысл пытаться сделать прямой запрос к rutube.ru из браузера?
   - CORS заблокирует такие запросы?
   - Cloudflare защита?

3. **Механизм "down":**
   - Правильно ли помечать прокси как 'down' на один таймаут?
   - Нет механизма восстановления — proxyStatus никогда не вернётся в 'up'?
   - Как реализовать health check?

4. **Docker-специфика:**
   - DNS 8.8.8.8 в Alpine контейнере — может быть проблема?
   - Нужен ли IPv6 fallback?

## Ожидаемый формат ответа

- **Технологический стек:** (подтверждение)
- **Цель кода:** (твоя интерпретация)
- **Симптомы:** (твой анализ симптомов)
- **Анализ кода:** (что ты видишь: ключевые переменные, условия, циклы, которые вызывают подозрение)
- **Решение:** (предложенный код с исправлениями для обоих файлов)
