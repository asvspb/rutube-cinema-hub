# Промпт 1: Рекурсия в Logger Service

## Технологический стек

- **Язык:** TypeScript
- **Среда:** Browser (React приложение)
- **Фреймворк:** React 18 + Vite

## Цель кода

Сервис `loggerService.ts` должен:

1. Отправлять логи с клиента на сервер через POST `/api/logs`
2. Перехватывать `console.error` и `console.warn` для автоматического логирования
3. Корректно обрабатывать ошибки сети при отправке логов

## Симптомы

```
[CLIENT LOG] { level: 'error', message: 'Console error', context: { args: [ 'Failed to send log to server:', [Object] ] } }
[CLIENT LOG] { level: 'error', message: 'Console error', context: { args: [ 'Failed to send log to server:', [Object] ] } }
[CLIENT LOG] { level: 'error', message: 'Console error', context: { args: [ 'Failed to send log to server:', [Object] ] } }
... (бесконечный цикл)
```

## Код для анализа

```typescript
// src/services/loggerService.ts
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: any;
  url?: string;
  stack?: string;
}

const LOG_SERVER_URL = '/api/logs';

class Logger {
  private consolePatched = false;
  private originalConsole = {
    error: console.error.bind(console),
    warn: console.warn.bind(console),
  };

  private async send(entry: LogEntry, options: { skipConsole?: boolean } = {}) {
    try {
      if (!options.skipConsole) {
        const consoleMethod =
          entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'log';
        console[consoleMethod](
          `[${entry.level.toUpperCase()}] ${entry.message}`,
          entry.context || ''
        );
      }

      await fetch(LOG_SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...entry,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (e) {
      // ПРОБЛЕМА ЗДЕСЬ: console.error триггерит патченный console.error
      console.error('Failed to send log to server:', e);
    }
  }

  info(message: string, context?: any) {
    this.send({ level: 'info', message, context });
  }

  warn(message: string, context?: any) {
    this.send({ level: 'warn', message, context });
  }

  error(message: string, context?: any, error?: Error) {
    this.send({
      level: 'error',
      message,
      context,
      stack: error?.stack,
    });
  }

  debug(message: string, context?: any) {
    this.send({ level: 'debug', message, context });
  }

  initConsoleCapture() {
    if (this.consolePatched) return;
    this.consolePatched = true;

    console.error = (...args: unknown[]) => {
      this.originalConsole.error(...args);
      this.send(
        {
          level: 'error',
          message: 'Console error',
          context: { args: this.formatConsoleArgs(args) },
        },
        { skipConsole: true }
      );
    };

    console.warn = (...args: unknown[]) => {
      this.originalConsole.warn(...args);
      this.send(
        {
          level: 'warn',
          message: 'Console warn',
          context: { args: this.formatConsoleArgs(args) },
        },
        { skipConsole: true }
      );
    };
  }

  // ... остальной код
}

export const logger = new Logger();
```

## Вопросы

1. Почему возникает бесконечная рекурсия?
2. Как правильно разорвать цикл `console.error → send → catch → console.error`?
3. Нужно ли использовать флаг `isSending` или лучше использовать `originalConsole.error` в catch-блоке?
4. Какие ещё проблемы ты видишь в этом коде?

## Ожидаемый формат ответа

- **Технологический стек:** (подтверждение)
- **Цель кода:** (твоя интерпретация)
- **Симптомы:** (твой анализ симптомов)
- **Анализ кода:** (что ты видишь: ключевые переменные, условия, циклы, которые вызывают подозрение)
- **Решение:** (предложенный код с исправлениями)
