import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  parseRutubeUrl,
  calculateRating,
  calculateGravity,
  sortVideos,
  formatSubscribers,
  formatDuration,
  formatViews,
  formatRelativeTime,
  getEmbedUrl,
  DEFAULT_RATING_SETTINGS,
  DEFAULT_CHANNELS,
  DEFAULT_PLAYLISTS_BY_CHANNEL,
  fetchVideos,
  fetchChannelInfo,
  fetchChannelPlaylists,
  resolveRutubeId,
} from '../../src/services/rutubeService';
import { RutubeVideo, RatingSettings, CategoryDef } from '../../src/types';

vi.mock('../../src/services/loggerService', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('rutubeService', () => {
  describe('DEFAULT_CHANNELS', () => {
    it('should have 5 system channels', () => {
      expect(DEFAULT_CHANNELS).toHaveLength(5);
      expect(DEFAULT_CHANNELS.every(c => c.isSystem)).toBe(true);
    });
  });

  describe('DEFAULT_PLAYLISTS_BY_CHANNEL', () => {
    it('should have playlists for each default channel', () => {
      DEFAULT_CHANNELS.forEach(channel => {
        expect(DEFAULT_PLAYLISTS_BY_CHANNEL[channel.rutubeId]).toBeDefined();
      });
    });
  });

  describe('parseRutubeUrl', () => {
    it('should parse channel URL format /channel/{id}', () => {
      const result = parseRutubeUrl('https://rutube.ru/channel/32869212/');
      expect(result).toEqual({ id: '32869212', type: 'channel' });
    });

    it('should parse channel URL without trailing slash', () => {
      const result = parseRutubeUrl('https://rutube.ru/channel/32869212');
      expect(result).toEqual({ id: '32869212', type: 'channel' });
    });

    it('should parse user URL format /u/{username}', () => {
      const result = parseRutubeUrl('https://rutube.ru/u/someuser/');
      expect(result).toEqual({ id: 'someuser', type: 'channel' });
    });

    it('should parse playlist URL format /plst/{id}', () => {
      const result = parseRutubeUrl('https://rutube.ru/plst/123456/');
      expect(result).toEqual({ id: '123456', type: 'playlist' });
    });

    it('should handle URL without protocol', () => {
      const result = parseRutubeUrl('rutube.ru/channel/32869212/');
      expect(result).toEqual({ id: '32869212', type: 'channel' });
    });

    it('should handle URL with spaces', () => {
      const result = parseRutubeUrl('  https://rutube.ru/channel/32869212/  ');
      expect(result).toEqual({ id: '32869212', type: 'channel' });
    });

    it('should return null for invalid URL', () => {
      expect(parseRutubeUrl('not a url')).toBeNull();
      expect(parseRutubeUrl('https://youtube.com/watch?v=123')).toBeNull();
      expect(parseRutubeUrl('https://rutube.ru/video/abc123/')).toBeNull();
    });

    it('should return null for malformed URLs', () => {
      expect(parseRutubeUrl('')).toBeNull();
      expect(parseRutubeUrl('://invalid')).toBeNull();
    });
  });

  describe('calculateRating', () => {
    it('should return 0 for invalid views', () => {
      expect(calculateRating(NaN, '2024-01-01')).toBe(0);
      expect(calculateRating(-1, '2024-01-01')).toBe(0);
    });

    it('should return 0 for invalid date', () => {
      expect(calculateRating(1000, 'invalid')).toBe(0);
    });

    it('should calculate rating with default settings', () => {
      const rating = calculateRating(10000, '2024-01-01');
      expect(rating).toBeGreaterThanOrEqual(1);
      expect(rating).toBeLessThanOrEqual(10);
    });

    it('should return minimum rating 1.0', () => {
      const rating = calculateRating(0, new Date().toISOString());
      expect(rating).toBeGreaterThanOrEqual(1);
    });

    it('should cap rating at 10.0', () => {
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 1);
      const rating = calculateRating(100000000, recentDate.toISOString());
      expect(rating).toBeLessThanOrEqual(10);
    });

    describe('with experimental strategy', () => {
      const expSettings: RatingSettings = {
        ...DEFAULT_RATING_SETTINGS,
        useExperimentalStrategy: true,
        thresholdLow: 50000,
        thresholdHigh: 500000,
        targetRatingLow: 7.0,
        targetRatingHigh: 9.0,
      };

      it('should return 1.0 for very low views', () => {
        expect(calculateRating(5, '2024-01-01', expSettings)).toBe(1.0);
      });

      it('should calculate rating for views in threshold range', () => {
        const rating = calculateRating(100000, '2024-01-01', expSettings);
        expect(rating).toBeGreaterThan(7);
        expect(rating).toBeLessThan(9);
      });

      it('should calculate rating for high views', () => {
        const rating = calculateRating(1000000, '2024-01-01', expSettings);
        expect(rating).toBeGreaterThanOrEqual(9);
      });

      it('should use custom thresholds', () => {
        const customSettings: RatingSettings = {
          ...expSettings,
          thresholdLow: 100,
          thresholdHigh: 10000,
          targetRatingLow: 5.0,
          targetRatingHigh: 8.0,
        };
        const rating = calculateRating(1000, '2024-01-01', customSettings);
        expect(rating).toBeGreaterThan(5);
        expect(rating).toBeLessThan(8);
      });
    });

    describe('with standard strategy', () => {
      it('should return 4.0 for very low views per day', () => {
        const oldDate = new Date('2020-01-01');
        const rating = calculateRating(1, oldDate.toISOString());
        expect(rating).toBe(4.0);
      });

      it('should use custom ratingBase', () => {
        const settings: RatingSettings = {
          ...DEFAULT_RATING_SETTINGS,
          ratingBase: 7.0,
        };
        const rating = calculateRating(10000, '2024-01-01', settings);
        expect(rating).toBeGreaterThanOrEqual(7);
      });

      it('should use custom ratingLogScale', () => {
        const settings: RatingSettings = {
          ...DEFAULT_RATING_SETTINGS,
          ratingLogScale: 2.0,
        };
        const rating = calculateRating(10000, '2024-01-01', settings);
        const defaultRating = calculateRating(10000, '2024-01-01', DEFAULT_RATING_SETTINGS);
        expect(rating).not.toBe(defaultRating);
      });
    });
  });

  describe('calculateGravity', () => {
    it('should return 0 for invalid views', () => {
      expect(calculateGravity(NaN, '2024-01-01')).toBe(0);
      expect(calculateGravity(-1, '2024-01-01')).toBe(0);
    });

    it('should return 0 for invalid date', () => {
      expect(calculateGravity(1000, 'invalid')).toBe(0);
    });

    it('should calculate gravity for recent video', () => {
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 24);
      const gravity = calculateGravity(1000, recentDate.toISOString());
      expect(gravity).toBeGreaterThan(0);
    });

    it('should decrease gravity for older videos', () => {
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 24);
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);

      const recentGravity = calculateGravity(1000, recentDate.toISOString());
      const oldGravity = calculateGravity(1000, oldDate.toISOString());

      expect(recentGravity).toBeGreaterThan(oldGravity);
    });

    it('should increase gravity with more views', () => {
      const date = '2024-01-15';
      const lowGravity = calculateGravity(100, date);
      const highGravity = calculateGravity(10000, date);
      expect(highGravity).toBeGreaterThan(lowGravity);
    });

    it('should use custom gravityHourOffset', () => {
      const settings: RatingSettings = {
        ...DEFAULT_RATING_SETTINGS,
        gravityHourOffset: 10,
      };
      const gravity = calculateGravity(1000, '2024-01-01', settings);
      expect(gravity).toBeGreaterThanOrEqual(0);
    });

    it('should use custom gravityPower', () => {
      const settings: RatingSettings = {
        ...DEFAULT_RATING_SETTINGS,
        gravityPower: 2.0,
      };
      const gravity = calculateGravity(1000, '2024-01-01', settings);
      expect(gravity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('sortVideos', () => {
    const createVideo = (overrides: Partial<RutubeVideo> = {}): RutubeVideo => ({
      id: '1',
      title: 'Test Video',
      description: '',
      thumbnail_url: '',
      duration: 100,
      views: 1000,
      created_ts: '2024-01-01',
      video_url: '',
      html: '',
      rating: 5.0,
      gravity: 1.0,
      ...overrides,
    });

    const videos: RutubeVideo[] = [
      createVideo({
        id: '1',
        title: 'Alpha',
        rating: 8.0,
        views: 5000,
        created_ts: '2024-03-01',
        gravity: 3.0,
      }),
      createVideo({
        id: '2',
        title: 'Beta',
        rating: 5.0,
        views: 10000,
        created_ts: '2024-02-01',
        gravity: 1.0,
      }),
      createVideo({
        id: '3',
        title: 'Gamma',
        rating: 9.0,
        views: 1000,
        created_ts: '2024-01-01',
        gravity: 2.0,
      }),
    ];

    it('should return reversed order for default sort desc', () => {
      const sorted = sortVideos(videos, 'default', 'desc');
      expect(sorted[0].id).toBe('3');
      expect(sorted[2].id).toBe('1');
    });

    it('should return original order for default sort asc', () => {
      const sorted = sortVideos(videos, 'default', 'asc');
      expect(sorted[0].id).toBe('1');
      expect(sorted[2].id).toBe('3');
    });

    it('should sort by rating desc', () => {
      const sorted = sortVideos(videos, 'rating', 'desc');
      expect(sorted[0].rating).toBe(9.0);
      expect(sorted[2].rating).toBe(5.0);
    });

    it('should sort by rating asc', () => {
      const sorted = sortVideos(videos, 'rating', 'asc');
      expect(sorted[0].rating).toBe(5.0);
      expect(sorted[2].rating).toBe(9.0);
    });

    it('should sort by views desc', () => {
      const sorted = sortVideos(videos, 'views', 'desc');
      expect(sorted[0].views).toBe(10000);
      expect(sorted[2].views).toBe(1000);
    });

    it('should sort by views asc', () => {
      const sorted = sortVideos(videos, 'views', 'asc');
      expect(sorted[0].views).toBe(1000);
      expect(sorted[2].views).toBe(10000);
    });

    it('should sort by trend (gravity) desc', () => {
      const sorted = sortVideos(videos, 'trend', 'desc');
      expect(sorted[0].gravity).toBe(3.0);
      expect(sorted[2].gravity).toBe(1.0);
    });

    it('should sort by date desc', () => {
      const sorted = sortVideos(videos, 'date', 'desc');
      expect(sorted[0].id).toBe('1');
      expect(sorted[2].id).toBe('3');
    });

    it('should sort by date asc', () => {
      const sorted = sortVideos(videos, 'date', 'asc');
      expect(sorted[0].id).toBe('3');
      expect(sorted[2].id).toBe('1');
    });

    it('should sort alphabetically asc', () => {
      const sorted = sortVideos(videos, 'alphabetical', 'asc');
      expect(sorted[0].title).toBe('Alpha');
      expect(sorted[2].title).toBe('Gamma');
    });

    it('should sort alphabetically desc', () => {
      const sorted = sortVideos(videos, 'alphabetical', 'desc');
      expect(sorted[0].title).toBe('Gamma');
      expect(sorted[2].title).toBe('Alpha');
    });

    it('should sort by year', () => {
      const yearVideos = [
        createVideo({ id: '1', title: 'Film 2020' }),
        createVideo({ id: '2', title: 'Film 2024' }),
        createVideo({ id: '3', title: 'Film 2018' }),
      ];
      const sorted = sortVideos(yearVideos, 'year', 'desc');
      expect(sorted[0].title).toBe('Film 2024');
    });

    it('should sort by watched status', () => {
      const watchedStatuses = { '1': 'watched' as const, '2': 'watched' as const };
      const sorted = sortVideos(videos, 'watched', 'desc', watchedStatuses);
      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('3');
    });

    it('should sort by liked status', () => {
      const likedStatuses = { '3': 'liked' as const };
      const sorted = sortVideos(videos, 'liked', 'desc', {}, likedStatuses);
      expect(sorted[0].id).toBe('3');
    });

    it('should sort by watch_later status', () => {
      const watchLaterStatuses = { '2': 'watch_later' as const };
      const sorted = sortVideos(videos, 'watch_later', 'desc', watchLaterStatuses);
      expect(sorted[0].id).toBe('2');
    });

    it('should not modify original array', () => {
      const original = [...videos];
      sortVideos(videos, 'rating', 'desc');
      expect(videos).toEqual(original);
    });
  });

  describe('formatSubscribers', () => {
    it('should format 0 subscribers', () => {
      expect(formatSubscribers(0)).toBe('0');
    });

    it('should format negative as 0', () => {
      expect(formatSubscribers(-5)).toBe('0');
    });

    it('should format NaN as 0', () => {
      expect(formatSubscribers(NaN)).toBe('0');
    });

    it('should format thousands with K suffix', () => {
      expect(formatSubscribers(1500)).toBe('1.5K');
      expect(formatSubscribers(999999)).toMatch(/K$/);
    });

    it('should format millions with M suffix', () => {
      expect(formatSubscribers(1500000)).toBe('1.5M');
      expect(formatSubscribers(1000000)).toBe('1M');
    });

    it('should format small numbers with locale', () => {
      expect(formatSubscribers(500)).toBe('500');
    });
  });

  describe('formatDuration', () => {
    it('should return 0:00 for invalid input', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(-1)).toBe('0:00');
      expect(formatDuration(NaN)).toBe('0:00');
      expect(formatDuration(undefined)).toBe('0:00');
      expect(formatDuration(null)).toBe('0:00');
    });

    it('should format seconds only', () => {
      expect(formatDuration(45)).toBe('0:45');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(125)).toBe('2:05');
      expect(formatDuration(3661)).toBe('1:01:01');
    });

    it('should format hours, minutes and seconds', () => {
      expect(formatDuration(3661)).toBe('1:01:01');
      expect(formatDuration(7322)).toBe('2:02:02');
    });

    it('should pad seconds with zero', () => {
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(61)).toBe('1:01');
    });

    it('should pad minutes with zero for hours', () => {
      expect(formatDuration(3600)).toBe('1:00:00');
      expect(formatDuration(3660)).toBe('1:01:00');
    });
  });

  describe('formatViews', () => {
    it('should return 0 for invalid input', () => {
      expect(formatViews(0)).toBe('0');
      expect(formatViews(-1)).toBe('0');
      expect(formatViews(NaN)).toBe('0');
      expect(formatViews(undefined)).toBe('0');
      expect(formatViews(null)).toBe('0');
    });

    it('should format small numbers as is', () => {
      expect(formatViews(500)).toBe('500');
    });

    it('should format thousands with K suffix', () => {
      expect(formatViews(1500)).toBe('1.5K');
      expect(formatViews(999999)).toBe('1000.0K');
    });

    it('should format millions with M suffix', () => {
      expect(formatViews(1500000)).toBe('1.5M');
      expect(formatViews(10000000)).toBe('10.0M');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return empty string for invalid date', () => {
      expect(formatRelativeTime('')).toBe('');
      expect(formatRelativeTime('invalid')).toBe('');
    });

    it('should return "только что" for recent times', () => {
      const now = new Date('2024-06-15T12:00:00Z');
      expect(formatRelativeTime(now.toISOString())).toBe('только что');
    });

    it('should return minutes ago', () => {
      const date = new Date('2024-06-15T11:55:00Z');
      expect(formatRelativeTime(date.toISOString())).toMatch(/мин\./);
    });

    it('should return hours ago', () => {
      const date = new Date('2024-06-15T10:00:00Z');
      expect(formatRelativeTime(date.toISOString())).toMatch(/ч\./);
    });

    it('should return days ago', () => {
      const date = new Date('2024-06-13T12:00:00Z');
      expect(formatRelativeTime(date.toISOString())).toMatch(/дн\./);
    });

    it('should return weeks ago', () => {
      const date = new Date('2024-06-01T12:00:00Z');
      expect(formatRelativeTime(date.toISOString())).toMatch(/нед\./);
    });

    it('should return months ago', () => {
      const date = new Date('2024-03-15T12:00:00Z');
      expect(formatRelativeTime(date.toISOString())).toMatch(/мес\./);
    });

    it('should return years ago', () => {
      const date = new Date('2022-06-15T12:00:00Z');
      expect(formatRelativeTime(date.toISOString())).toMatch(/г\./);
    });
  });

  describe('getEmbedUrl', () => {
    it('should return embed URL for video ID', () => {
      expect(getEmbedUrl('abc123')).toBe('https://rutube.ru/play/embed/abc123');
    });
  });

  describe('fetchVideos', () => {
    const mockCategory: CategoryDef = {
      id: 'test-channel',
      label: 'Test Channel',
      rutubeId: '12345678',
      type: 'channel',
    };

    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('should return empty result when no rutubeId', async () => {
      const category: CategoryDef = { ...mockCategory, rutubeId: '' };
      const result = await fetchVideos(category);
      expect(result).toEqual({ videos: [], nextUrl: null });
    });

    it('should return empty result for invalid rutubeId format', async () => {
      const category: CategoryDef = { ...mockCategory, rutubeId: 'abc' };
      const result = await fetchVideos(category);
      expect(result).toEqual({ videos: [], nextUrl: null });
    });

    it('should return empty result for playlist with invalid rutubeId', async () => {
      const category: CategoryDef = { ...mockCategory, type: 'playlist', rutubeId: 'short' };
      const result = await fetchVideos(category);
      expect(result).toEqual({ videos: [], nextUrl: null });
    });

    it('should handle network errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const result = await fetchVideos(mockCategory);

      expect(result.videos).toEqual([]);
    });

    it('should return object with videos and nextUrl', async () => {
      vi.mocked(fetch).mockImplementation(
        async () =>
          ({
            ok: true,
            text: async () => JSON.stringify({ results: [], next: null }),
          }) as Response
      );

      const result = await fetchVideos(mockCategory);

      expect(result).toHaveProperty('videos');
      expect(result).toHaveProperty('nextUrl');
      expect(Array.isArray(result.videos)).toBe(true);
    });
  });

  describe('fetchChannelInfo', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('should return null for empty rutubeId', async () => {
      const result = await fetchChannelInfo('');
      expect(result).toBeNull();
    });

    it('should return null for null/undefined rutubeId', async () => {
      const result = await fetchChannelInfo(null as any);
      expect(result).toBeNull();
    });

    it('should return null on fetch error', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
      const result = await fetchChannelInfo('12345678');
      expect(result).toBeNull();
    });

    it('should return null for invalid response', async () => {
      vi.mocked(fetch).mockImplementation(
        async () =>
          ({
            ok: false,
            status: 404,
          }) as Response
      );

      const result = await fetchChannelInfo('12345678');
      expect(result).toBeNull();
    });
  });

  describe('resolveRutubeId', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('should return id for playlist type', async () => {
      const result = await resolveRutubeId('123', 'playlist');
      expect(result).toBe('123');
    });

    it('should return id for numeric channel id', async () => {
      const result = await resolveRutubeId('12345678', 'channel');
      expect(result).toBe('12345678');
    });

    it('should return null when cannot resolve username', async () => {
      vi.mocked(fetch).mockImplementation(
        async () =>
          ({
            ok: false,
          }) as Response
      );

      const result = await resolveRutubeId('nonexistent', 'channel');

      expect(result).toBeNull();
    });

    it('should handle network error gracefully', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const result = await resolveRutubeId('username', 'channel');

      expect(result).toBeNull();
    });
  });
});
