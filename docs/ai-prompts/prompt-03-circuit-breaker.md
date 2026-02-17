# Промпт 3: Circuit Breaker для Proxy Service

## Технологический стек

- **Язык:** TypeScript
- **Среда:** Browser (React приложение)
- **Фреймворк:** React 18 + Vite
- **Паттерны:** Circuit Breaker, Retry with Backoff

## Цель кода

Реализовать надежный механизм отказоустойчивости для прокси-сервиса:

1. Circuit Breaker — автоматическое отключение падающего прокси
2. Health Check — периодическая проверка восстановления
3. Retry with Exponential Backoff — умные повторы
4. Graceful Degradation — информативные ошибки для пользователя

## Симптомы (текущее поведение)

```
1. Один таймаут → прокси помечается как 'down' навсегда
2. Нет способа восстановить прокси без перезагрузки страницы
3. Пользователь видит "All proxies failed" вместо понятной ошибки
4. Нет повторных попыток с задержкой
5. Прямые запросы к Rutube всегда падают (CORS/Cloudflare)
```

## Код для анализа

### Текущая реализация (упрощённо)

```typescript
// src/services/rutubeService.ts

type ProxyStatus = 'unknown' | 'up' | 'down';
let localProxyStatus: ProxyStatus = 'unknown';

const getProxies = () => {
  const proxies: Array<(target: string) => string> = [];
  if (localProxyStatus !== 'down') {
    proxies.push((target: string) => `/api/proxy?url=${encodeURIComponent(target)}`);
  }
  proxies.push((target: string) => target); // Прямой запрос — почти всегда fail
  return proxies;
};

// При таймауте:
if (isLocal) {
  localProxyStatus = 'down'; // Навсегда!
  logger.warn('Local proxy timeout, marking as down', { targetUrl });
}
```

### Требуемая архитектура

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CIRCUIT BREAKER STATES                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────┐   fail > threshold    ┌──────────┐                   │
│   │  CLOSED  │ ────────────────────▶ │   OPEN   │                   │
│   │ (normal) │                       │ (failing)│                   │
│   └──────────┘                       └────┬─────┘                   │
│        ▲                                  │                         │
│        │                                  │ after timeout           │
│        │ success                          │                         │
│        │                                  ▼                         │
│   ┌────┴─────┐   success            ┌──────────┐                   │
│   │  CLOSED  │ ◀─────────────────── │HALF-OPEN │                   │
│   └──────────┘                      └──────────┘                   │
│                                      │ fail                         │
│                                      │                              │
│                                      └──────▶ OPEN                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

Параметры:
- failureThreshold: 3 (после скольких ошибок открыть)
- resetTimeout: 30000ms (через сколько попробовать снова)
- halfOpenMaxCalls: 1 (сколько запросов в half-open состоянии)
```

## Вопросы

1. **Circuit Breaker:**
   - Как реализовать три состояния: CLOSED, OPEN, HALF-OPEN?
   - Какие пороги failures использовать?
   - Как быстро переходить в HALF-OPEN для проверки?

2. **Health Check:**
   - Как периодически проверять доступность прокси?
   - Нужен ли отдельный endpoint `/api/health/proxy`?
   - Или проверять при следующем запросе?

3. **Exponential Backoff:**
   - Как реализовать растущие интервалы между повторами?
   - Базовый интервал? Максимальный?
   - Jitter для предотвращения thundering herd?

4. **Graceful Degradation:**
   - Какие сообщения показывать пользователю?
   - Как отличить "сервер недоступен" от "канал не найден"?
   - Стоит ли показать retry button?

5. **Fallback стратегия:**
   - Убрать ли прямой запрос к Rutube (бесполезен из-за CORS)?
   - Или оставить как крайний случай?

## Ожидаемый формат ответа

- **Технологический стек:** (подтверждение)
- **Цель кода:** (твоя интерпретация)
- **Симптомы:** (твой анализ текущих проблем)
- **Анализ кода:** (ключевые переменные, условия, логика которая требует изменений)
- **Решение:** (полный код Circuit Breaker класса + интеграция в rutubeService.ts)
