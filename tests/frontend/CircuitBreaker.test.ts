import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CircuitBreaker } from '../../src/utils/CircuitBreaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 30000,
    });
  });

  describe('Initial State', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getFailureCount()).toBe(0);
      expect(breaker.canRequest()).toBe(true);
    });

    it('should return 0 time until reset when CLOSED', () => {
      expect(breaker.getTimeUntilReset()).toBe(0);
    });
  });

  describe('CLOSED State', () => {
    it('should allow requests when CLOSED', () => {
      expect(breaker.canRequest()).toBe(true);
    });

    it('should remain CLOSED after successes', () => {
      breaker.recordSuccess();
      expect(breaker.getState()).toBe('CLOSED');

      breaker.recordSuccess();
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should track failure count', () => {
      breaker.recordFailure();
      expect(breaker.getFailureCount()).toBe(1);
      expect(breaker.getState()).toBe('CLOSED');

      breaker.recordFailure();
      expect(breaker.getFailureCount()).toBe(2);
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should reset failure count on success', () => {
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.getFailureCount()).toBe(2);

      breaker.recordSuccess();
      expect(breaker.getFailureCount()).toBe(0);
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should open after reaching failure threshold', () => {
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();

      expect(breaker.getState()).toBe('OPEN');
      expect(breaker.canRequest()).toBe(false);
    });
  });

  describe('OPEN State', () => {
    beforeEach(() => {
      // Open the breaker
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.getState()).toBe('OPEN');
    });

    it('should block requests when OPEN', () => {
      expect(breaker.canRequest()).toBe(false);
    });

    it('should report time until reset when OPEN', () => {
      const timeUntilReset = breaker.getTimeUntilReset();
      expect(timeUntilReset).toBeGreaterThan(0);
      expect(timeUntilReset).toBeLessThanOrEqual(30000);
    });

    it('should stay OPEN and report decreasing time', () => {
      const time1 = breaker.getTimeUntilReset();
      // Wait a bit (not using fake timers)
      const start = Date.now();
      while (Date.now() - start < 10) {}
      const time2 = breaker.getTimeUntilReset();
      expect(time2).toBeLessThanOrEqual(time1);
    });
  });

  describe('HALF_OPEN State (via mock)', () => {
    it('should allow canRequest to transition state after timeout', () => {
      // Create breaker with very short timeout
      const fastBreaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 10, // 10ms
      });

      // Open it
      fastBreaker.recordFailure();
      expect(fastBreaker.getState()).toBe('OPEN');

      // Wait for timeout
      const start = Date.now();
      while (Date.now() - start < 20) {}

      // Now canRequest should return true and transition to HALF_OPEN
      expect(fastBreaker.canRequest()).toBe(true);
      expect(fastBreaker.getState()).toBe('HALF_OPEN');
    });

    it('should transition from HALF_OPEN to CLOSED on success', () => {
      const fastBreaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 10,
      });

      fastBreaker.recordFailure();
      const start = Date.now();
      while (Date.now() - start < 20) {}
      fastBreaker.canRequest();

      expect(fastBreaker.getState()).toBe('HALF_OPEN');
      fastBreaker.recordSuccess();
      expect(fastBreaker.getState()).toBe('CLOSED');
    });

    it('should transition from HALF_OPEN back to OPEN on failure', () => {
      const fastBreaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 10,
      });

      fastBreaker.recordFailure();
      const start = Date.now();
      while (Date.now() - start < 20) {}
      fastBreaker.canRequest();

      expect(fastBreaker.getState()).toBe('HALF_OPEN');
      fastBreaker.recordFailure();
      expect(fastBreaker.getState()).toBe('OPEN');
      expect(fastBreaker.canRequest()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle exactly threshold failures', () => {
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.getState()).toBe('CLOSED');

      breaker.recordFailure(); // Third failure = threshold
      expect(breaker.getState()).toBe('OPEN');
    });

    it('should handle more than threshold failures', () => {
      for (let i = 0; i < 10; i++) {
        breaker.recordFailure();
      }
      expect(breaker.getState()).toBe('OPEN');
      expect(breaker.getFailureCount()).toBe(10);
    });
  });
});
