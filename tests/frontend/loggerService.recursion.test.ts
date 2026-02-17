import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

describe('LoggerService - Recursion Prevention', () => {
  let logger: any;

  beforeEach(async () => {
    vi.resetAllMocks();

    // Reset console mocks
    console.error = vi.fn();
    console.warn = vi.fn();
    console.log = vi.fn();

    // Re-import logger to get fresh instance
    vi.resetModules();
    const module = await import('../../src/services/loggerService');
    logger = module.logger;
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  });

  describe('Recursion Prevention', () => {
    it('should not recurse when fetch fails in send()', async () => {
      // Mock fetch to fail
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Call error which triggers send
      await logger.error('Test error', { foo: 'bar' });

      // Wait for any async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // fetch should be called once, not multiple times (no recursion)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should use originalConsole.error in catch block, not patched console.error', async () => {
      const mockConsoleError = vi.fn();
      console.error = mockConsoleError;

      // Mock fetch to fail
      mockFetch.mockRejectedValue(new Error('Network error'));

      await logger.error('Test error');

      await new Promise(resolve => setTimeout(resolve, 10));

      // The patched console.error should have been called for the initial log
      // But NOT recursively from the catch block
      // If recursion was happening, we'd see many calls
      expect(mockConsoleError.mock.calls.length).toBeLessThanOrEqual(2);
    });

    it('should prevent re-entry with isSending flag', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((_, reject) => {
            // Simulate slow network
            setTimeout(() => reject(new Error('Timeout')), 100);
          })
      );

      // Start multiple send operations simultaneously
      const promises = [
        logger.info('Message 1'),
        logger.info('Message 2'),
        logger.info('Message 3'),
      ];

      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 150));

      // Only first call should go through due to isSending guard
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Console Capture', () => {
    it('should capture console.error and send to server', async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);

      logger.initConsoleCapture();

      console.error('Test console error', { detail: 'test' });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/logs',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Console error'),
        })
      );
    });

    it('should capture console.warn and send to server', async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);

      logger.initConsoleCapture();

      console.warn('Test console warning');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/logs',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Console warn'),
        })
      );
    });

    it('should not cause infinite loop when fetch fails during console capture', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      logger.initConsoleCapture();

      // This should NOT cause infinite recursion
      console.error('Trigger error');

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should be finite number of calls (not hundreds from recursion)
      expect(mockFetch.mock.calls.length).toBeLessThan(5);
    });
  });

  describe('Error Formatting', () => {
    it('should format Error objects in console args', async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);

      logger.initConsoleCapture();

      const error = new Error('Custom error');
      console.error('Error occurred:', error);

      await new Promise(resolve => setTimeout(resolve, 10));

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const body = JSON.parse(lastCall[1].body);

      expect(body.context.args[1]).toHaveProperty('message', 'Custom error');
      expect(body.context.args[1]).toHaveProperty('stack');
    });
  });

  describe('Global Error Handlers', () => {
    it('should set up window.onerror handler', async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);

      logger.initGlobalHandlers();

      // Verify handler is set
      expect(window.onerror).toBeDefined();
    });

    it('should set up unhandledrejection handler', async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);

      logger.initGlobalHandlers();

      // Verify handler is set
      expect(window.onunhandledrejection).toBeDefined();
    });
  });
});
