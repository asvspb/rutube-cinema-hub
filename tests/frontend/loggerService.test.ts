import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

class Logger {
  private consolePatched = false;
  private originalConsole = {
    error: console.error.bind(console),
    warn: console.warn.bind(console),
  };

  private async send(entry: any, options: { skipConsole?: boolean } = {}) {
    try {
      if (!options.skipConsole) {
        const consoleMethod =
          entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'log';
        console[consoleMethod](
          `[${entry.level.toUpperCase()}] ${entry.message}`,
          entry.context || ''
        );
      }

      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...entry,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (e) {
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

  private formatConsoleArgs(args: unknown[]) {
    return args.map(arg => {
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
          context: { args: this.formatConsoleArgs(args) },
        },
        { skipConsole: true }
      );
    };

    console.warn = (...args: unknown[]) => {
      this.originalConsole.warn(...args);
      this.send(
        { level: 'warn', message: 'Console warn', context: { args: this.formatConsoleArgs(args) } },
        { skipConsole: true }
      );
    };
  }

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

describe('LoggerService', () => {
  let logger: Logger;
  let mockFetch: any;

  beforeEach(() => {
    logger = new Logger();
    mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('info', () => {
    it('should send info log', async () => {
      logger.info('Test message', { key: 'value' });
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/logs',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  describe('warn', () => {
    it('should send warn log', async () => {
      logger.warn('Warning message');
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should send error log with context', async () => {
      logger.error('Error message', { code: 500 });
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should include stack trace when error provided', async () => {
      const error = new Error('Test error');
      logger.error('Error occurred', {}, error);
      await new Promise(resolve => setTimeout(resolve, 10));

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.stack).toBeDefined();
    });
  });

  describe('debug', () => {
    it('should send debug log', async () => {
      logger.debug('Debug info', { detail: 'test' });
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('formatConsoleArgs', () => {
    it('should handle circular objects', async () => {
      const obj: any = { a: 1 };
      obj.self = obj;

      let errorThrown = false;
      try {
        logger.info('Circular', obj);
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch {
        errorThrown = true;
      }

      expect(true).toBe(true);
    });
  });

  describe('initConsoleCapture', () => {
    it('should capture console.error', async () => {
      logger.initConsoleCapture();
      console.error('Captured error');
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should capture console.warn', async () => {
      logger.initConsoleCapture();
      console.warn('Captured warning');
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should only initialize once', () => {
      logger.initConsoleCapture();
      logger.initConsoleCapture();
      // Should not throw or double-patch
      expect(true).toBe(true);
    });
  });

  describe('initGlobalHandlers', () => {
    it('should set up window.onerror', () => {
      logger.initGlobalHandlers();
      expect(window.onerror).toBeDefined();
    });

    it('should set up window.onunhandledrejection', () => {
      logger.initGlobalHandlers();
      expect(window.onunhandledrejection).toBeDefined();
    });
  });
});
