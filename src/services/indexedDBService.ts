/**
 * IndexedDB Service for persistent caching
 * Provides larger storage capacity than localStorage (~5MB vs ~50MB+)
 * Supports TTL-based expiration
 */

const DB_NAME = 'RutubeCinemaHub';
const DB_VERSION = 1;

// Store names
const STORES = {
  METADATA_CACHE: 'metadataCache',
  VIDEO_CACHE: 'videoCache',
  LLM_RESPONSES: 'llmResponses',
} as const;

// TTL constants (in milliseconds)
export const TTL = {
  LLM_RESPONSES: 7 * 24 * 60 * 60 * 1000, // 7 days
  METADATA_CACHE: 7 * 24 * 60 * 60 * 1000, // 7 days
  VIDEO_CACHE: 24 * 60 * 60 * 1000, // 1 day
} as const;

interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    // Prevent multiple initializations
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB: Failed to open database', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB: Database opened successfully');
        resolve(request.result);
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'key' });
            console.log(`IndexedDB: Created store "${storeName}"`);
          }
        });
      };
    });

    return this.dbPromise;
  }

  /**
   * Get a value from the cache
   */
  async get<T>(storeName: string, key: string): Promise<T | null> {
    try {
      const db = await this.init();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onerror = () => {
          console.error(`IndexedDB: Failed to get "${key}" from ${storeName}`, request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          const entry = request.result as CacheEntry<T> | undefined;

          if (!entry) {
            resolve(null);
            return;
          }

          // Check if entry has expired
          const now = Date.now();
          if (now - entry.timestamp > entry.ttl) {
            // Entry expired, delete it
            this.delete(storeName, key);
            resolve(null);
            return;
          }

          resolve(entry.value);
        };
      });
    } catch (error) {
      console.error(`IndexedDB: Error getting "${key}" from ${storeName}`, error);
      return null;
    }
  }

  /**
   * Set a value in the cache
   */
  async set<T>(
    storeName: string,
    key: string,
    value: T,
    ttl: number = TTL.METADATA_CACHE
  ): Promise<boolean> {
    try {
      const db = await this.init();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        const entry: CacheEntry<T> = {
          key,
          value,
          timestamp: Date.now(),
          ttl,
        };

        const request = store.put(entry);

        request.onerror = () => {
          console.error(`IndexedDB: Failed to set "${key}" in ${storeName}`, request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve(true);
        };
      });
    } catch (error) {
      console.error(`IndexedDB: Error setting "${key}" in ${storeName}`, error);
      return false;
    }
  }

  /**
   * Delete a value from the cache
   */
  async delete(storeName: string, key: string): Promise<boolean> {
    try {
      const db = await this.init();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onerror = () => {
          console.error(`IndexedDB: Failed to delete "${key}" from ${storeName}`, request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve(true);
        };
      });
    } catch (error) {
      console.error(`IndexedDB: Error deleting "${key}" from ${storeName}`, error);
      return false;
    }
  }

  /**
   * Clear all entries from a store
   */
  async clearStore(storeName: string): Promise<boolean> {
    try {
      const db = await this.init();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onerror = () => {
          console.error(`IndexedDB: Failed to clear ${storeName}`, request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          console.log(`IndexedDB: Cleared store "${storeName}"`);
          resolve(true);
        };
      });
    } catch (error) {
      console.error(`IndexedDB: Error clearing ${storeName}`, error);
      return false;
    }
  }

  /**
   * Get all keys from a store
   */
  async getAllKeys(storeName: string): Promise<string[]> {
    try {
      const db = await this.init();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAllKeys();

        request.onerror = () => {
          console.error(`IndexedDB: Failed to get keys from ${storeName}`, request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve(request.result as string[]);
        };
      });
    } catch (error) {
      console.error(`IndexedDB: Error getting keys from ${storeName}`, error);
      return [];
    }
  }

  /**
   * Get all entries from a store
   */
  async getAll<T>(storeName: string): Promise<Record<string, T>> {
    try {
      const db = await this.init();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onerror = () => {
          console.error(`IndexedDB: Failed to get all from ${storeName}`, request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          const entries = request.result as CacheEntry<T>[];
          const now = Date.now();
          const result: Record<string, T> = {};

          for (const entry of entries) {
            // Only include non-expired entries
            if (now - entry.timestamp <= entry.ttl) {
              result[entry.key] = entry.value;
            }
          }

          resolve(result);
        };
      });
    } catch (error) {
      console.error(`IndexedDB: Error getting all from ${storeName}`, error);
      return {};
    }
  }

  /**
   * Clean up expired entries in a store
   */
  async cleanupExpired(storeName: string): Promise<number> {
    try {
      const db = await this.init();
      const now = Date.now();
      let deletedCount = 0;

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.openCursor();

        request.onerror = () => {
          console.error(`IndexedDB: Failed to cleanup ${storeName}`, request.error);
          reject(request.error);
        };

        request.onsuccess = event => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

          if (cursor) {
            const entry = cursor.value as CacheEntry<unknown>;

            if (now - entry.timestamp > entry.ttl) {
              cursor.delete();
              deletedCount++;
            }

            cursor.continue();
          } else {
            if (deletedCount > 0) {
              console.log(
                `IndexedDB: Cleaned up ${deletedCount} expired entries from ${storeName}`
              );
            }
            resolve(deletedCount);
          }
        };
      });
    } catch (error) {
      console.error(`IndexedDB: Error cleaning up ${storeName}`, error);
      return 0;
    }
  }

  /**
   * Cleanup all expired entries across all stores
   */
  async cleanupAllExpired(): Promise<void> {
    const storeNames = Object.values(STORES);
    await Promise.all(storeNames.map(store => this.cleanupExpired(store)));
  }

  /**
   * Get store size estimate (approximate)
   */
  async getStoreSize(storeName: string): Promise<number> {
    try {
      const db = await this.init();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count();

        request.onerror = () => {
          console.error(`IndexedDB: Failed to count ${storeName}`, request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve(request.result);
        };
      });
    } catch (error) {
      console.error(`IndexedDB: Error counting ${storeName}`, error);
      return 0;
    }
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();

// Export store names for convenience
export const { METADATA_CACHE, VIDEO_CACHE, LLM_RESPONSES } = STORES;
