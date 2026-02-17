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
  // Флаг для защиты от рекурсии внутри самого процесса логирования
  private isSending = false;

  private originalConsole = {
    error: console.error.bind(console),
    warn: console.warn.bind(console),
    log: console.log.bind(console),
  };

  private async send(entry: LogEntry, options: { skipConsole?: boolean } = {}) {
    // Защита от рекурсии: если мы уже внутри отправки, не пытаемся отправить снова
    if (this.isSending) {
      return;
    }

    try {
      this.isSending = true;

      if (!options.skipConsole) {
        const consoleMethod =
          entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'log';
        // Используем originalConsole для вывода, чтобы не триггерить перехватчики повторно
        this.originalConsole[consoleMethod](
          `[${entry.level.toUpperCase()}] ${entry.message}`,
          entry.context || ''
        );
      }

      await fetch(LOG_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entry,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (e) {
      // ИСПРАВЛЕНИЕ: Используем оригинальную консоль для вывода ошибки отправки
      this.originalConsole.error('Failed to send log to server:', e);
    } finally {
      this.isSending = false;
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

  private formatConsoleArgs(args: unknown[]) {
    try {
      return args.map(arg => {
        if (arg instanceof Error) {
          return { message: arg.message, stack: arg.stack };
        }
        return arg;
      });
    } catch {
      return ['Error formatting arguments'];
    }
  }

  initConsoleCapture() {
    if (this.consolePatched) return;
    this.consolePatched = true;

    console.error = (...args: unknown[]) => {
      // Сначала выводим в оригинальную консоль, чтобы разработчик видел ошибку сразу
      this.originalConsole.error(...args);

      // Отправляем на сервер
      this.send(
        {
          level: 'error',
          message: 'Console error',
          context: { args: this.formatConsoleArgs(args) },
        },
        { skipConsole: true } // Пропускаем вывод, т.к. уже вывели выше
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

  // Global error handlers
  initGlobalHandlers() {
    this.initConsoleCapture();

    window.onerror = (message, source, lineno, colno, error) => {
      this.error('Global window error', { message, source, lineno, colno }, error);
      return false;
    };

    window.onunhandledrejection = event => {
      this.error('Unhandled promise rejection', { reason: event.reason });
    };
  }
}

export const logger = new Logger();
