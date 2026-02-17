import {
  DEFAULT_CHANNELS,
  DEFAULT_PLAYLISTS_BY_CHANNEL,
  DEFAULT_RATING_SETTINGS,
} from './rutubeService';
import { ChannelDef, RatingSettings, MovieRatingData, CachedPlaylistData } from '../types';
import { indexedDBService, METADATA_CACHE, VIDEO_CACHE, TTL } from './indexedDBService';

// Define storage keys
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

// Define storage types
export interface StorageData {
  channels: ChannelDef[];
  activeChannelId: string;
  isLoggedIn: boolean;
  watchHistory: any[]; // Using any for now since we'll define this in hooks
  videoWatchedStatuses: Record<string, 'watched' | 'watch_later'>;
  videoLikedStatuses: Record<string, 'liked' | 'disliked'>;
  metadataCache: Record<string, any>; // Using any for now since we'll define this in hooks
  allPlaylists: Record<string, any[]>; // Using any for now since we'll define this in hooks
  ratingSettings: RatingSettings;
  gridColumns: 2 | 3 | 4;
}

export class StorageService {
  // Channels
  static getChannels(): ChannelDef[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHANNELS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(c => c && c.id && c.label)) {
          // Filter out removed system channels from saved state
          const filteredSaved = parsed.filter(
            savedChannel =>
              !savedChannel.isSystem ||
              DEFAULT_CHANNELS.some(def => def.rutubeId === savedChannel.rutubeId)
          );

          const missingDefaults = DEFAULT_CHANNELS.filter(
            def => !filteredSaved.some(savedChannel => savedChannel.rutubeId === def.rutubeId)
          );

          if (missingDefaults.length > 0 || filteredSaved.length !== parsed.length) {
            const result = [...filteredSaved, ...missingDefaults];
            // Update localStorage immediately to prevent re-loading on next refresh
            this.setChannels(result);
            return result;
          }
          return filteredSaved;
        }
      }
    } catch (e) {
      console.error('Failed to load channels', e);
    }
    return DEFAULT_CHANNELS;
  }

  static setChannels(channels: ChannelDef[]): void {
    localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(channels));
  }

  // Active Channel ID
  static getActiveChannelId(): string {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_CHANNEL);
      if (saved) return saved;
    } catch (e) {}

    const firstId = DEFAULT_CHANNELS[0]?.id || '';
    return firstId;
  }

  static setActiveChannelId(channelId: string): void {
    if (channelId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CHANNEL, channelId);
    }
  }

  // Is Logged In
  static getIsLoggedIn(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true';
    } catch {
      return false;
    }
  }

  static setIsLoggedIn(isLoggedIn: boolean): void {
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, String(isLoggedIn));
  }

  // Watch History
  static getWatchHistory(isLoggedIn: boolean): any[] {
    try {
      const key = isLoggedIn ? STORAGE_KEYS.HISTORY_USER : STORAGE_KEYS.HISTORY_GUEST;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  static setWatchHistory(history: any[], isLoggedIn: boolean): void {
    const key = isLoggedIn ? STORAGE_KEYS.HISTORY_USER : STORAGE_KEYS.HISTORY_GUEST;
    localStorage.setItem(key, JSON.stringify(history));
  }

  // Video Watched Statuses
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
  ): void {
    const key = isLoggedIn
      ? STORAGE_KEYS.STATUSES_USER_WATCHED
      : STORAGE_KEYS.STATUSES_GUEST_WATCHED;
    localStorage.setItem(key, JSON.stringify(statuses));
  }

  // Video Liked Statuses
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
  ): void {
    const key = isLoggedIn ? STORAGE_KEYS.STATUSES_USER_LIKED : STORAGE_KEYS.STATUSES_GUEST_LIKED;
    localStorage.setItem(key, JSON.stringify(statuses));
  }

  // Metadata Cache
  static getMetadataCache(): Record<string, any> {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.METADATA_CACHE);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  static setMetadataCache(cache: Record<string, any>): void {
    localStorage.setItem(STORAGE_KEYS.METADATA_CACHE, JSON.stringify(cache));
  }

  // All Playlists
  static getAllPlaylists(): Record<string, any[]> {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_PLAYLISTS_BY_CHANNEL, ...parsed };
        }
      }
    } catch (e) {
      console.error('Failed to load playlists', e);
    }
    return DEFAULT_PLAYLISTS_BY_CHANNEL;
  }

  static setAllPlaylists(playlists: Record<string, any[]>): void {
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
  }

  // Rating Settings
  static getRatingSettings(): RatingSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RATING_SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_RATING_SETTINGS;
    } catch (e) {
      return DEFAULT_RATING_SETTINGS;
    }
  }

  static setRatingSettings(settings: RatingSettings): void {
    localStorage.setItem(STORAGE_KEYS.RATING_SETTINGS, JSON.stringify(settings));
  }

  // Grid Columns
  static getGridColumns(): 2 | 3 | 4 {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GRID_COLUMNS);
      return saved ? JSON.parse(saved) : 3;
    } catch (e) {
      return 3;
    }
  }

  static setGridColumns(columns: 2 | 3 | 4): void {
    localStorage.setItem(STORAGE_KEYS.GRID_COLUMNS, JSON.stringify(columns));
  }

  // Migration helper for old status structure
  static migrateOldStatusStructure(isLoggedIn: boolean): {
    watched: Record<string, 'watched' | 'watch_later'>;
    liked: Record<string, 'liked' | 'disliked'>;
  } {
    const keys = {
      history: isLoggedIn ? STORAGE_KEYS.HISTORY_USER : STORAGE_KEYS.HISTORY_GUEST,
      statuses: isLoggedIn
        ? 'rutube_cinema_v2_statuses_user' // Old key
        : 'rutube_cinema_v2_statuses_guest', // Old key
    };

    try {
      const savedStatus = localStorage.getItem(keys.statuses);
      if (savedStatus) {
        const oldStatuses = JSON.parse(savedStatus);

        // Separate the old statuses into watched and liked
        const newWatchedStatuses: Record<string, 'watched' | 'watch_later'> = {};
        const newLikedStatuses: Record<string, 'liked' | 'disliked'> = {};

        Object.entries(oldStatuses).forEach(([videoId, status]) => {
          if (status === 'watched' || status === 'watch_later') {
            newWatchedStatuses[videoId] = status;
          } else if (status === 'liked') {
            newLikedStatuses[videoId] = 'liked';
          }
        });

        // Clear the old statuses to avoid duplication in the future
        localStorage.removeItem(keys.statuses);

        return { watched: newWatchedStatuses, liked: newLikedStatuses };
      } else {
        // Load the new separate statuses
        const savedWatched = localStorage.getItem(
          isLoggedIn ? STORAGE_KEYS.STATUSES_USER_WATCHED : STORAGE_KEYS.STATUSES_GUEST_WATCHED
        );
        const savedLiked = localStorage.getItem(
          isLoggedIn ? STORAGE_KEYS.STATUSES_USER_LIKED : STORAGE_KEYS.STATUSES_GUEST_LIKED
        );

        return {
          watched: savedWatched ? JSON.parse(savedWatched) : {},
          liked: savedLiked ? JSON.parse(savedLiked) : {},
        };
      }
    } catch {
      return { watched: {}, liked: {} };
    }
  }

  // ==================== IndexedDB Methods ====================

  /**
   * Initialize IndexedDB and migrate data from localStorage
   * Should be called once on app startup
   */
  static async initializeIndexedDB(): Promise<void> {
    try {
      await indexedDBService.init();
      console.log('StorageService: IndexedDB initialized');

      // Migrate metadata cache from localStorage to IndexedDB
      await this.migrateMetadataCacheToIndexedDB();
    } catch (error) {
      console.error('StorageService: Failed to initialize IndexedDB', error);
    }
  }

  /**
   * Migrate metadata cache from localStorage to IndexedDB
   */
  private static async migrateMetadataCacheToIndexedDB(): Promise<void> {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.METADATA_CACHE);
      if (!saved) return;

      const localCache = JSON.parse(saved);
      if (!localCache || Object.keys(localCache).length === 0) return;

      // Check if IndexedDB already has data
      const idbCache = await indexedDBService.getAll<MovieRatingData>(METADATA_CACHE);
      if (Object.keys(idbCache).length > 0) {
        console.log('StorageService: IndexedDB already has metadata cache, skipping migration');
        return;
      }

      // Migrate each entry
      let migratedCount = 0;
      for (const [key, value] of Object.entries(localCache)) {
        if (value) {
          await indexedDBService.set(
            METADATA_CACHE,
            key,
            value as MovieRatingData,
            TTL.METADATA_CACHE
          );
          migratedCount++;
        }
      }

      console.log(`StorageService: Migrated ${migratedCount} metadata entries to IndexedDB`);

      // Keep localStorage as fallback for now, but clear after successful migration
      // localStorage.removeItem(STORAGE_KEYS.METADATA_CACHE);
    } catch (error) {
      console.error('StorageService: Failed to migrate metadata cache', error);
    }
  }

  /**
   * Get metadata cache (async, from IndexedDB)
   */
  static async getMetadataCacheAsync(): Promise<Record<string, MovieRatingData>> {
    try {
      return await indexedDBService.getAll<MovieRatingData>(METADATA_CACHE);
    } catch (error) {
      console.error('StorageService: Failed to get metadata cache from IndexedDB', error);
      // Fallback to localStorage
      return this.getMetadataCache();
    }
  }

  /**
   * Set metadata cache entry in IndexedDB
   */
  static async setMetadataCacheEntry(key: string, data: MovieRatingData): Promise<void> {
    try {
      await indexedDBService.set(METADATA_CACHE, key, data, TTL.METADATA_CACHE);
    } catch (error) {
      console.error('StorageService: Failed to set metadata cache entry', error);
    }
  }

  /**
   * Get single metadata cache entry
   */
  static async getMetadataCacheEntry(key: string): Promise<MovieRatingData | null> {
    try {
      return await indexedDBService.get<MovieRatingData>(METADATA_CACHE, key);
    } catch (error) {
      console.error('StorageService: Failed to get metadata cache entry', error);
      return null;
    }
  }

  /**
   * Clear metadata cache
   */
  static async clearMetadataCache(): Promise<void> {
    try {
      await indexedDBService.clearStore(METADATA_CACHE);
      localStorage.removeItem(STORAGE_KEYS.METADATA_CACHE);
    } catch (error) {
      console.error('StorageService: Failed to clear metadata cache', error);
    }
  }

  // ==================== Video Cache (IndexedDB) ====================

  /**
   * Get video cache from IndexedDB
   */
  static async getVideoCacheAsync(): Promise<Record<string, CachedPlaylistData>> {
    try {
      return await indexedDBService.getAll<CachedPlaylistData>(VIDEO_CACHE);
    } catch (error) {
      console.error('StorageService: Failed to get video cache from IndexedDB', error);
      return {};
    }
  }

  /**
   * Get single video cache entry
   */
  static async getVideoCacheEntry(categoryId: string): Promise<CachedPlaylistData | null> {
    try {
      return await indexedDBService.get<CachedPlaylistData>(VIDEO_CACHE, categoryId);
    } catch (error) {
      console.error('StorageService: Failed to get video cache entry', error);
      return null;
    }
  }

  /**
   * Set video cache entry in IndexedDB
   */
  static async setVideoCacheEntry(categoryId: string, data: CachedPlaylistData): Promise<void> {
    try {
      await indexedDBService.set(VIDEO_CACHE, categoryId, data, TTL.VIDEO_CACHE);
    } catch (error) {
      console.error('StorageService: Failed to set video cache entry', error);
    }
  }

  /**
   * Remove video cache entry
   */
  static async removeVideoCacheEntry(categoryId: string): Promise<void> {
    try {
      await indexedDBService.delete(VIDEO_CACHE, categoryId);
    } catch (error) {
      console.error('StorageService: Failed to remove video cache entry', error);
    }
  }

  /**
   * Clear video cache
   */
  static async clearVideoCache(): Promise<void> {
    try {
      await indexedDBService.clearStore(VIDEO_CACHE);
    } catch (error) {
      console.error('StorageService: Failed to clear video cache', error);
    }
  }

  // ==================== Cleanup ====================

  /**
   * Cleanup expired entries in all caches
   */
  static async cleanupExpiredCaches(): Promise<void> {
    try {
      await indexedDBService.cleanupAllExpired();
      console.log('StorageService: Cleaned up expired cache entries');
    } catch (error) {
      console.error('StorageService: Failed to cleanup expired caches', error);
    }
  }
}
