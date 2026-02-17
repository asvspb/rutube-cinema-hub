import { describe, it, expect, beforeEach, vi } from 'vitest';

const STORAGE_KEYS = {
  CHANNELS: 'rutube_cinema_v2_channels',
  ACTIVE_CHANNEL: 'rutube_cinema_v2_active_channel',
  IS_LOGGED_IN: 'rutube_cinema_v2_is_logged_in',
  HISTORY_USER: 'rutube_cinema_v2_history_user',
  HISTORY_GUEST: 'rutube_cinema_v2_history_guest',
  STATUSES_USER_WATCHED: 'rutube_cinema_v2_statuses_user_watched',
  STATUSES_GUEST_WATCHED: 'rutube_cinema_v2_statuses_guest_watched',
  STATUSES_USER_LIKED: 'rutube_cinema_v2_statuses_user_liked',
  STATUSES_GUEST_LIKED: 'rutube_cinema_v2_statuses_guest_liked',
  PLAYLISTS: 'rutube_cinema_v2_playlists',
  METADATA_CACHE: 'rutube_cinema_v2_metadata_cache',
  RATING_SETTINGS: 'rutube_cinema_v2_rating_settings',
  GRID_COLUMNS: 'rutube_cinema_v2_grid_columns',
} as const;

const DEFAULT_CHANNELS = [
  { id: '1', label: 'Channel 1', rutubeId: '111', isSystem: true },
  { id: '2', label: 'Channel 2', rutubeId: '222', isSystem: true },
];

const DEFAULT_RATING_SETTINGS = {
  ratingBase: 5,
  ratingLogScale: 2,
  gravityHourOffset: 1,
  gravityPower: 1.5,
  useExperimentalStrategy: false,
  thresholdLow: 100,
  thresholdHigh: 10000,
};

class StorageService {
  static getChannels() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHANNELS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(c => c && c.id && c.label)) {
          return parsed;
        }
      }
    } catch {
      console.error('Failed to load channels');
    }
    return DEFAULT_CHANNELS;
  }

  static setChannels(channels: any[]) {
    localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(channels));
  }

  static getActiveChannelId() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_CHANNEL);
      if (saved) return saved;
    } catch {}
    return DEFAULT_CHANNELS[0]?.id || '';
  }

  static setActiveChannelId(channelId: string) {
    if (channelId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CHANNEL, channelId);
    }
  }

  static getIsLoggedIn(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true';
    } catch {
      return false;
    }
  }

  static setIsLoggedIn(isLoggedIn: boolean) {
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, String(isLoggedIn));
  }

  static getWatchHistory(isLoggedIn: boolean): any[] {
    try {
      const key = isLoggedIn ? STORAGE_KEYS.HISTORY_USER : STORAGE_KEYS.HISTORY_GUEST;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  static setWatchHistory(history: any[], isLoggedIn: boolean) {
    const key = isLoggedIn ? STORAGE_KEYS.HISTORY_USER : STORAGE_KEYS.HISTORY_GUEST;
    localStorage.setItem(key, JSON.stringify(history));
  }

  static getVideoWatchedStatuses(isLoggedIn: boolean): Record<string, 'watched' | 'watch_later'> {
    try {
      const key = isLoggedIn
        ? STORAGE_KEYS.STATUSES_USER_WATCHED
        : STORAGE_KEYS.STATUSES_GUEST_WATCHED;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  static setVideoWatchedStatuses(
    statuses: Record<string, 'watched' | 'watch_later'>,
    isLoggedIn: boolean
  ) {
    const key = isLoggedIn
      ? STORAGE_KEYS.STATUSES_USER_WATCHED
      : STORAGE_KEYS.STATUSES_GUEST_WATCHED;
    localStorage.setItem(key, JSON.stringify(statuses));
  }

  static getVideoLikedStatuses(isLoggedIn: boolean): Record<string, 'liked' | 'disliked'> {
    try {
      const key = isLoggedIn ? STORAGE_KEYS.STATUSES_USER_LIKED : STORAGE_KEYS.STATUSES_GUEST_LIKED;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  static setVideoLikedStatuses(
    statuses: Record<string, 'liked' | 'disliked'>,
    isLoggedIn: boolean
  ) {
    const key = isLoggedIn ? STORAGE_KEYS.STATUSES_USER_LIKED : STORAGE_KEYS.STATUSES_GUEST_LIKED;
    localStorage.setItem(key, JSON.stringify(statuses));
  }

  static getMetadataCache(): Record<string, any> {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.METADATA_CACHE);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  static setMetadataCache(cache: Record<string, any>) {
    localStorage.setItem(STORAGE_KEYS.METADATA_CACHE, JSON.stringify(cache));
  }

  static getRatingSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RATING_SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_RATING_SETTINGS;
    } catch {
      return DEFAULT_RATING_SETTINGS;
    }
  }

  static setRatingSettings(settings: any) {
    localStorage.setItem(STORAGE_KEYS.RATING_SETTINGS, JSON.stringify(settings));
  }

  static getGridColumns(): 2 | 3 | 4 {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GRID_COLUMNS);
      return saved ? JSON.parse(saved) : 3;
    } catch {
      return 3;
    }
  }

  static setGridColumns(columns: 2 | 3 | 4) {
    localStorage.setItem(STORAGE_KEYS.GRID_COLUMNS, JSON.stringify(columns));
  }
}

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Channels', () => {
    it('should return default channels when nothing is saved', () => {
      const channels = StorageService.getChannels();
      expect(channels).toEqual(DEFAULT_CHANNELS);
    });

    it('should save and retrieve channels', () => {
      const customChannels = [{ id: '3', label: 'Custom Channel', rutubeId: '333' }];
      StorageService.setChannels(customChannels);
      const retrieved = StorageService.getChannels();
      expect(retrieved).toEqual(customChannels);
    });

    it('should return default channels on invalid data', () => {
      localStorage.setItem(STORAGE_KEYS.CHANNELS, 'invalid json');
      const channels = StorageService.getChannels();
      expect(channels).toEqual(DEFAULT_CHANNELS);
    });
  });

  describe('Active Channel ID', () => {
    it('should return default channel ID when nothing is saved', () => {
      const id = StorageService.getActiveChannelId();
      expect(id).toBe(DEFAULT_CHANNELS[0].id);
    });

    it('should save and retrieve active channel ID', () => {
      StorageService.setActiveChannelId('channel-123');
      expect(StorageService.getActiveChannelId()).toBe('channel-123');
    });

    it('should not save empty channel ID', () => {
      StorageService.setActiveChannelId('');
      expect(localStorage.setItem).not.toHaveBeenCalledWith(STORAGE_KEYS.ACTIVE_CHANNEL, '');
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
      const statuses: Record<string, 'watched' | 'watch_later'> = {
        'video-1': 'watched',
        'video-2': 'watch_later',
      };
      StorageService.setVideoWatchedStatuses(statuses, true);
      expect(StorageService.getVideoWatchedStatuses(true)).toEqual(statuses);
    });

    it('should save and retrieve liked statuses', () => {
      const statuses: Record<string, 'liked' | 'disliked'> = {
        'video-1': 'liked',
        'video-2': 'disliked',
      };
      StorageService.setVideoLikedStatuses(statuses, false);
      expect(StorageService.getVideoLikedStatuses(false)).toEqual(statuses);
    });
  });

  describe('Metadata Cache', () => {
    it('should return empty object when no cache', () => {
      expect(StorageService.getMetadataCache()).toEqual({});
    });

    it('should save and retrieve metadata cache', () => {
      const cache = { 'video-1': { title: 'Test' } };
      StorageService.setMetadataCache(cache);
      expect(StorageService.getMetadataCache()).toEqual(cache);
    });
  });

  describe('Rating Settings', () => {
    it('should return default settings when nothing is saved', () => {
      const settings = StorageService.getRatingSettings();
      expect(settings).toEqual(DEFAULT_RATING_SETTINGS);
    });

    it('should save and retrieve rating settings', () => {
      const customSettings = { ...DEFAULT_RATING_SETTINGS, ratingBase: 7 };
      StorageService.setRatingSettings(customSettings);
      expect(StorageService.getRatingSettings()).toEqual(customSettings);
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
});
