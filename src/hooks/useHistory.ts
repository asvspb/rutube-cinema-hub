import { useState, useEffect } from 'react';
import { RutubeVideo } from '../types';
import { StorageService } from '../services/storageService';

interface UseHistoryResult {
  watchHistory: RutubeVideo[];
  setWatchHistory: React.Dispatch<React.SetStateAction<RutubeVideo[]>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  addToHistory: (video: RutubeVideo) => void;
  removeFromHistory: (videoId: string) => void;
  clearHistory: () => void;
}

export const useHistory = (): UseHistoryResult => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => StorageService.getIsLoggedIn());
  const [watchHistory, setWatchHistory] = useState<RutubeVideo[]>(() =>
    StorageService.getWatchHistory(isLoggedIn)
  );

  // Handle login/logout state changes
  useEffect(() => {
    StorageService.setIsLoggedIn(isLoggedIn);

    // Reload history based on new login state
    setWatchHistory(StorageService.getWatchHistory(isLoggedIn));
  }, [isLoggedIn]);

  // Save history to storage when it changes
  useEffect(() => {
    StorageService.setWatchHistory(watchHistory, isLoggedIn);
  }, [watchHistory, isLoggedIn]);

  const addToHistory = (video: RutubeVideo) => {
    setWatchHistory(prev => {
      const filtered = prev.filter(v => v.id !== video.id);
      const newHistory = [video, ...filtered];
      return newHistory.slice(0, 100); // Keep only last 100 items
    });
  };

  const removeFromHistory = (videoId: string) => {
    setWatchHistory(prev => prev.filter(v => v.id !== videoId));
  };

  const clearHistory = () => {
    setWatchHistory([]);
  };

  return {
    watchHistory,
    setWatchHistory,
    isLoggedIn,
    setIsLoggedIn,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
};
