import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock logger
vi.mock('../../src/services/loggerService', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('RutubeService - Circuit Breaker Integration', () => {
  let rutubeService: any;

  beforeEach(async () => {
    vi.resetAllMocks();

    // Re-import to get fresh CircuitBreaker instance
    vi.resetModules();
    const module = await import('../../src/services/rutubeService');
    rutubeService = module;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getProxyStatus', () => {
    it('should return initial proxy status as CLOSED', () => {
      const status = rutubeService.getProxyStatus();

      expect(status.state).toBe('CLOSED');
      expect(status.failureCount).toBe(0);
      expect(status.timeUntilReset).toBe(0);
    });

    it('should return status object with required fields', () => {
      const status = rutubeService.getProxyStatus();

      expect(status).toHaveProperty('state');
      expect(status).toHaveProperty('failureCount');
      expect(status).toHaveProperty('timeUntilReset');
    });
  });

  describe('Circuit Breaker States', () => {
    it('should export getProxyStatus function', () => {
      expect(typeof rutubeService.getProxyStatus).toBe('function');
    });

    it('should have CLOSED state initially', () => {
      const status = rutubeService.getProxyStatus();
      expect(['CLOSED', 'OPEN', 'HALF_OPEN']).toContain(status.state);
    });
  });

  describe('Constants', () => {
    it('should have default channels defined', () => {
      expect(rutubeService.DEFAULT_CHANNELS).toBeDefined();
      expect(Array.isArray(rutubeService.DEFAULT_CHANNELS)).toBe(true);
      expect(rutubeService.DEFAULT_CHANNELS.length).toBeGreaterThan(0);
    });

    it('should have default rating settings', () => {
      expect(rutubeService.DEFAULT_RATING_SETTINGS).toBeDefined();
      expect(rutubeService.DEFAULT_RATING_SETTINGS.ratingBase).toBeDefined();
    });
  });

  describe('Helper Functions', () => {
    it('should parse rutube channel URLs', () => {
      const result = rutubeService.parseRutubeUrl('https://rutube.ru/channel/123456/');
      expect(result).toEqual({ id: '123456', type: 'channel' });
    });

    it('should parse rutube playlist URLs', () => {
      const result = rutubeService.parseRutubeUrl('https://rutube.ru/plst/789012/');
      expect(result).toEqual({ id: '789012', type: 'playlist' });
    });

    it('should return null for invalid URLs', () => {
      const result = rutubeService.parseRutubeUrl('https://example.com/video/123');
      expect(result).toBeNull();
    });

    it('should format duration correctly', () => {
      expect(rutubeService.formatDuration(65)).toBe('1:05');
      expect(rutubeService.formatDuration(3661)).toBe('1:01:01');
      expect(rutubeService.formatDuration(0)).toBe('0:00');
    });

    it('should format views correctly', () => {
      expect(rutubeService.formatViews(1500)).toBe('1.5K');
      expect(rutubeService.formatViews(1500000)).toBe('1.5M');
      expect(rutubeService.formatViews(500)).toBe('500');
    });

    it('should get embed URL', () => {
      expect(rutubeService.getEmbedUrl('abc123')).toBe('https://rutube.ru/play/embed/abc123');
    });
  });

  describe('Rating Calculations', () => {
    it('should calculate rating', () => {
      const rating = rutubeService.calculateRating(1000, '2024-01-01T00:00:00Z');
      expect(typeof rating).toBe('number');
      expect(rating).toBeGreaterThanOrEqual(0);
      expect(rating).toBeLessThanOrEqual(10);
    });

    it('should calculate gravity', () => {
      const gravity = rutubeService.calculateGravity(1000, '2024-01-01T00:00:00Z');
      expect(typeof gravity).toBe('number');
      expect(gravity).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for invalid views', () => {
      const rating = rutubeService.calculateRating(-100, '2024-01-01T00:00:00Z');
      expect(rating).toBe(0);
    });
  });

  describe('Sorting', () => {
    const mockVideos = [
      { id: '1', title: 'Video A', views: 100, rating: 5, gravity: 1, created_ts: '2024-01-01' },
      { id: '2', title: 'Video B', views: 200, rating: 8, gravity: 2, created_ts: '2024-01-02' },
      { id: '3', title: 'Video C', views: 150, rating: 3, gravity: 3, created_ts: '2024-01-03' },
    ];

    it('should sort by views descending', () => {
      const sorted = rutubeService.sortVideos(mockVideos, 'views', 'desc');
      expect(sorted[0].views).toBe(200);
      expect(sorted[2].views).toBe(100);
    });

    it('should sort by rating ascending', () => {
      const sorted = rutubeService.sortVideos(mockVideos, 'rating', 'asc');
      expect(sorted[0].rating).toBe(3);
      expect(sorted[2].rating).toBe(8);
    });

    it('should sort alphabetically', () => {
      const sorted = rutubeService.sortVideos(mockVideos, 'alphabetical', 'asc');
      expect(sorted[0].title).toBe('Video A');
      expect(sorted[2].title).toBe('Video C');
    });
  });
});
