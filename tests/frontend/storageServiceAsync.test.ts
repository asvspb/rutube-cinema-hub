import { describe, it, expect, beforeEach, vi } from 'vitest';

// Мокаем зависимости
vi.mock('../../src/services/rutubeService', () => ({
  DEFAULT_CHANNELS: [
    { id: '1', label: 'Channel 1', rutubeId: '111', isSystem: true },
    { id: '2', label: 'Channel 2', rutubeId: '222', isSystem: true },
  ],
  DEFAULT_PLAYLISTS_BY_CHANNEL: {
    '111': [{ id: 'pl-1', label: 'Playlist 1', rutubeId: '111', type: 'channel', isSystem: true }],
  },
  DEFAULT_RATING_SETTINGS: {
    ratingBase: 5,
    ratingLogScale: 2,
    gravityHourOffset: 1,
    gravityPower: 1.5,
    useExperimentalStrategy: false,
    thresholdLow: 100,
    thresholdHigh: 10000,
  },
}));

vi.mock('../../src/services/indexedDBService', () => ({
  indexedDBService: {
    init: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    getAll: vi.fn(() => ({})),
    delete: vi.fn(),
    clearStore: vi.fn(),
    cleanupAllExpired: vi.fn(),
  },
  METADATA_CACHE: 'metadata_cache',
  VIDEO_CACHE: 'video_cache',
  TTL: {
    METADATA_CACHE: 86400000,
    VIDEO_CACHE: 3600000,
  },
}));

// Импортируем после моков
import { StorageService } from '../../src/services/storageService';

describe('StorageService - Async Methods', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Rating Settings', () => {
    it('should return default rating settings when nothing is saved', () => {
      const settings = StorageService.getRatingSettings();
      expect(settings.ratingBase).toBe(5);
      expect(settings.gravityPower).toBe(1.5);
    });

    it('should save and retrieve custom rating settings', () => {
      const customSettings = {
        ratingBase: 7,
        ratingLogScale: 3,
        gravityHourOffset: 2,
        gravityPower: 2.0,
        useExperimentalStrategy: true,
        thresholdLow: 50,
        thresholdHigh: 5000,
      };
      StorageService.setRatingSettings(customSettings);
      const retrieved = StorageService.getRatingSettings();
      expect(retrieved.ratingBase).toBe(7);
      expect(retrieved.useExperimentalStrategy).toBe(true);
    });
  });

  describe('Grid Columns', () => {
    it('should return default 3 columns when nothing is saved', () => {
      expect(StorageService.getGridColumns()).toBe(3);
    });

    it('should save and retrieve grid columns', () => {
      StorageService.setGridColumns(4);
      expect(StorageService.getGridColumns()).toBe(4);

      StorageService.setGridColumns(2);
      expect(StorageService.getGridColumns()).toBe(2);
    });
  });

  describe('Login Status', () => {
    it('should return false when not logged in', () => {
      expect(StorageService.getIsLoggedIn()).toBe(false);
    });

    it('should save and retrieve login status', () => {
      StorageService.setIsLoggedIn(true);
      expect(StorageService.getIsLoggedIn()).toBe(true);

      StorageService.setIsLoggedIn(false);
      expect(StorageService.getIsLoggedIn()).toBe(false);
    });
  });

  describe('Watch History', () => {
    it('should return empty array when no history', () => {
      expect(StorageService.getWatchHistory(false)).toEqual([]);
      expect(StorageService.getWatchHistory(true)).toEqual([]);
    });

    it('should save history separately for user and guest', () => {
      const userHistory = [{ id: '1', title: 'Video 1' }];
      const guestHistory = [{ id: '2', title: 'Video 2' }];

      StorageService.setWatchHistory(userHistory, true);
      StorageService.setWatchHistory(guestHistory, false);

      expect(StorageService.getWatchHistory(true)).toEqual(userHistory);
      expect(StorageService.getWatchHistory(false)).toEqual(guestHistory);
    });
  });

  describe('Video Statuses', () => {
    it('should return empty objects when no statuses', () => {
      expect(StorageService.getVideoWatchedStatuses(false)).toEqual({});
      expect(StorageService.getVideoLikedStatuses(false)).toEqual({});
    });

    it('should save and retrieve watched statuses', () => {
      const statuses = {
        'video-1': 'watched' as const,
        'video-2': 'watch_later' as const,
      };
      StorageService.setVideoWatchedStatuses(statuses, true);
      expect(StorageService.getVideoWatchedStatuses(true)).toEqual(statuses);
    });

    it('should save and retrieve liked statuses', () => {
      const statuses = {
        'video-1': 'liked' as const,
        'video-2': 'disliked' as const,
      };
      StorageService.setVideoLikedStatuses(statuses, false);
      expect(StorageService.getVideoLikedStatuses(false)).toEqual(statuses);
    });
  });

  describe('Playlists', () => {
    it('should return default playlists when nothing is saved', () => {
      const playlists = StorageService.getAllPlaylists();
      expect(typeof playlists).toBe('object');
    });

    it('should save and retrieve playlists', () => {
      const customPlaylists = {
        'channel-1': [{ id: 'pl-1', label: 'Custom Playlist', rutubeId: '123', type: 'playlist' }],
      };
      StorageService.setAllPlaylists(customPlaylists);
      const retrieved = StorageService.getAllPlaylists();
      expect(retrieved['channel-1']).toBeDefined();
    });
  });

  describe('Channels', () => {
    it('should return default channels when nothing is saved', () => {
      const channels = StorageService.getChannels();
      expect(Array.isArray(channels)).toBe(true);
    });

    it('should save and retrieve channels', () => {
      const customChannels = [
        { id: '3', label: 'Custom Channel', rutubeId: '333', isSystem: false },
      ];
      StorageService.setChannels(customChannels);
      const retrieved = StorageService.getChannels();
      expect(retrieved.some(c => c.rutubeId === '333')).toBe(true);
    });
  });

  describe('Active Channel', () => {
    it('should return empty string when no active channel', () => {
      localStorage.clear();
      const id = StorageService.getActiveChannelId();
      expect(typeof id).toBe('string');
    });

    it('should save and retrieve active channel ID', () => {
      StorageService.setActiveChannelId('channel-123');
      expect(StorageService.getActiveChannelId()).toBe('channel-123');
    });
  });

  describe('Migration helper', () => {
    it('should return empty statuses for new users', () => {
      const result = StorageService.migrateOldStatusStructure(true);
      expect(result.watched).toEqual({});
      expect(result.liked).toEqual({});
    });
  });
});
