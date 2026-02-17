import { useState, useCallback, useRef } from 'react';
import { RutubeVideo, CachedPlaylistData } from '../types';

interface UseVideoCacheResult {
  videoCache: Record<string, CachedPlaylistData>;
  setVideoCache: React.Dispatch<React.SetStateAction<Record<string, CachedPlaylistData>>>;
  addToCache: (categoryId: string, data: CachedPlaylistData) => void;
  removeFromCache: (categoryId: string) => void;
  getFromCache: (categoryId: string) => CachedPlaylistData | undefined;
  clearCache: () => void;
}

export const useVideoCache = (): UseVideoCacheResult => {
  const [videoCache, setVideoCache] = useState<Record<string, CachedPlaylistData>>({});
  const cacheRef = useRef(videoCache);
  cacheRef.current = videoCache;

  const addToCache = useCallback((categoryId: string, data: CachedPlaylistData) => {
    setVideoCache(prev => ({
      ...prev,
      [categoryId]: data,
    }));
  }, []);

  const removeFromCache = useCallback((categoryId: string) => {
    setVideoCache(prev => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  }, []);

  const getFromCache = useCallback((categoryId: string) => {
    return cacheRef.current[categoryId];
  }, []);

  const clearCache = useCallback(() => {
    setVideoCache({});
  }, []);

  return {
    videoCache,
    setVideoCache,
    addToCache,
    removeFromCache,
    getFromCache,
    clearCache,
  };
};
