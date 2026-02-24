import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setAccessToken,
  getAccessToken,
  isAuthenticated,
  getErrorMessage,
  getErrorCode,
} from '../../src/services/authService';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    })),
    isAxiosError: vi.fn(error => error?.isAxiosError === true),
  },
}));

describe('Auth Service', () => {
  beforeEach(() => {
    // Reset token before each test
    setAccessToken(null);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token management', () => {
    it('should start with null token', () => {
      expect(getAccessToken()).toBeNull();
    });

    it('should set and get access token', () => {
      const token = 'test-access-token';
      setAccessToken(token);
      expect(getAccessToken()).toBe(token);
    });

    it('should clear access token', () => {
      setAccessToken('test-token');
      setAccessToken(null);
      expect(getAccessToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token', () => {
      setAccessToken(null);
      expect(isAuthenticated()).toBe(false);
    });

    it('should return true when token exists', () => {
      setAccessToken('test-token');
      expect(isAuthenticated()).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should extract error message from Axios error', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            error: {
              message: 'Invalid credentials',
            },
          },
        },
      };

      const message = getErrorMessage(axiosError);
      expect(message).toBe('Invalid credentials');
    });

    it('should return generic message for non-Axios error', () => {
      const error = new Error('Something went wrong');
      const message = getErrorMessage(error);
      expect(message).toBe('Something went wrong');
    });

    it('should return default message for unknown error', () => {
      const message = getErrorMessage('unknown');
      expect(message).toBe('An unexpected error occurred');
    });

    it('should extract error code from Axios error', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            error: {
              code: 'INVALID_CREDENTIALS',
            },
          },
        },
      };

      const code = getErrorCode(axiosError);
      expect(code).toBe('INVALID_CREDENTIALS');
    });

    it('should return null for non-Axios error', () => {
      const error = new Error('Something went wrong');
      const code = getErrorCode(error);
      expect(code).toBeNull();
    });
  });
});
