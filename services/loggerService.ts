
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: any;
  url?: string;
  stack?: string;
}

const LOG_SERVER_URL = 'http://localhost:9230/api/logs';

class Logger {
  private async send(entry: LogEntry) {
    try {
      // Also log to console for development
      const consoleMethod = entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${entry.level.toUpperCase()}] ${entry.message}`, entry.context || '');

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

  // Global error handlers
  initGlobalHandlers() {
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
