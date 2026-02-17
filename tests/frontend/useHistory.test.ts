import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory } from '../../src/hooks/useHistory';
import { StorageService } from '../../src/services/storageService';
import { RutubeVideo } from '../../src/types';

vi.mock('../../src/services/storageService', () => ({
  StorageService: {
    getIsLoggedIn: vi.fn(() => false),
    setIsLoggedIn: vi.fn(),
    getWatchHistory: vi.fn(() => []),
    setWatchHistory: vi.fn(),
  },
}));

describe('useHistory', () => {
  const mockVideo: RutubeVideo = {
    id: '123',
    title: 'Test Video',
    description: 'Test Description',
    thumbnail_url: 'http://example.com/thumb.jpg',
    duration: 3600,
    views: 1000,
    created_ts: '2024-01-01',
    video_url: 'http://example.com/video',
    html: '<iframe></iframe>',
    rating: 8.5,
    gravity: 5.2,
  };

  const mockVideo2: RutubeVideo = {
    ...mockVideo,
    id: '456',
    title: 'Test Video 2',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with empty history', () => {
      const { result } = renderHook(() => useHistory());

      expect(result.current.watchHistory).toEqual([]);
      expect(result.current.isLoggedIn).toBe(false);
    });

    it('should load history from storage', () => {
      vi.mocked(StorageService.getWatchHistory).mockReturnValue([mockVideo]);

      const { result } = renderHook(() => useHistory());

      expect(result.current.watchHistory).toEqual([mockVideo]);
    });

    it('should load isLoggedIn from storage', () => {
      vi.mocked(StorageService.getIsLoggedIn).mockReturnValue(true);

      const { result } = renderHook(() => useHistory());

      expect(result.current.isLoggedIn).toBe(true);
    });
  });

  describe('addToHistory', () => {
    it('should add video to history', () => {
      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.addToHistory(mockVideo);
      });

      expect(result.current.watchHistory).toHaveLength(1);
      expect(result.current.watchHistory[0]).toEqual(mockVideo);
    });

    it('should add video to the beginning of history', () => {
      vi.mocked(StorageService.getWatchHistory).mockReturnValue([mockVideo2]);

      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.addToHistory(mockVideo);
      });

      expect(result.current.watchHistory[0]).toEqual(mockVideo);
      expect(result.current.watchHistory[1]).toEqual(mockVideo2);
    });

    it('should remove duplicate when adding same video', () => {
      vi.mocked(StorageService.getWatchHistory).mockReturnValue([mockVideo, mockVideo2]);

      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.addToHistory(mockVideo);
      });

      expect(result.current.watchHistory).toHaveLength(2);
      expect(result.current.watchHistory[0]).toEqual(mockVideo);
    });

    it('should limit history to 100 items', () => {
      const { result } = renderHook(() => useHistory());

      const videos = Array.from({ length: 105 }, (_, i) => ({
        ...mockVideo,
        id: `video-${i}`,
        title: `Video ${i}`,
      }));

      act(() => {
        videos.forEach(v => result.current.addToHistory(v));
      });

      expect(result.current.watchHistory).toHaveLength(100);
      expect(result.current.watchHistory[0].id).toBe('video-104');
      expect(result.current.watchHistory[99].id).toBe('video-5');
    });
  });

  describe('removeFromHistory', () => {
    it('should remove video from history', () => {
      vi.mocked(StorageService.getWatchHistory).mockReturnValue([mockVideo, mockVideo2]);

      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.removeFromHistory('123');
      });

      expect(result.current.watchHistory).toHaveLength(1);
      expect(result.current.watchHistory[0]).toEqual(mockVideo2);
    });

    it('should handle non-existent video', () => {
      vi.mocked(StorageService.getWatchHistory).mockReturnValue([mockVideo]);

      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.removeFromHistory('non-existent');
      });

      expect(result.current.watchHistory).toHaveLength(1);
    });

    it('should handle empty history', () => {
      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.removeFromHistory('123');
      });

      expect(result.current.watchHistory).toEqual([]);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history', () => {
      vi.mocked(StorageService.getWatchHistory).mockReturnValue([mockVideo, mockVideo2]);

      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.watchHistory).toEqual([]);
    });
  });

  describe('setIsLoggedIn', () => {
    it('should update isLoggedIn state', () => {
      vi.mocked(StorageService.getIsLoggedIn).mockReturnValue(false);

      const { result } = renderHook(() => useHistory());

      expect(result.current.isLoggedIn).toBe(false);

      act(() => {
        result.current.setIsLoggedIn(true);
      });

      expect(result.current.isLoggedIn).toBe(true);
    });

    it('should reload history when login state changes', async () => {
      vi.mocked(StorageService.getIsLoggedIn).mockReturnValue(false);
      vi.mocked(StorageService.getWatchHistory)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([mockVideo]);

      const { result } = renderHook(() => useHistory());

      expect(result.current.watchHistory).toEqual([]);

      await act(async () => {
        result.current.setIsLoggedIn(true);
      });

      expect(StorageService.getWatchHistory).toHaveBeenCalledWith(true);
    });
  });

  describe('setWatchHistory', () => {
    it('should replace entire history', () => {
      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.setWatchHistory([mockVideo, mockVideo2]);
      });

      expect(result.current.watchHistory).toHaveLength(2);
      expect(result.current.watchHistory[0]).toEqual(mockVideo);
    });
  });

  describe('storage persistence', () => {
    it('should persist login state to storage', () => {
      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.setIsLoggedIn(true);
      });

      expect(StorageService.setIsLoggedIn).toHaveBeenCalledWith(true);
    });

    it('should persist history to storage', () => {
      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.addToHistory(mockVideo);
      });

      expect(StorageService.setWatchHistory).toHaveBeenCalled();
    });
  });
});
