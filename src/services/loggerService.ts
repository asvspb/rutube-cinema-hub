
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
    warn: console.warn.bind(console)
  };

  private async send(entry: LogEntry, options: { skipConsole?: boolean } = {}) {
    try {
      if (!options.skipConsole) {
        // Also log to console for development
        const consoleMethod = entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'log';
        console[consoleMethod](`[${entry.level.toUpperCase()}] ${entry.message}`, entry.context || '');
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
      // Fallback if logging server is down
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
      stack: error?.stack 
    });
  }

  debug(message: string, context?: any) {
    this.send({ level: 'debug', message, context });
  }

  private formatConsoleArgs(args: unknown[]) {
    return args.map((arg) => {
      if (arg instanceof Error) {
        return { message: arg.message, stack: arg.stack };
      }
      if (typeof arg === 'object') {
        try {
          return JSON.parse(JSON.stringify(arg));
        } catch {
          return String(arg);
        }
      }
      return arg;
    });
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
          context: { args: this.formatConsoleArgs(args) }
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
          context: { args: this.formatConsoleArgs(args) }
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

    window.onunhandledrejection = (event) => {
      this.error('Unhandled promise rejection', { reason: event.reason });
    };
  }
}

export const logger = new Logger();
