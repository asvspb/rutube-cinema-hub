import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVideoStatuses } from '../../src/hooks/useVideoStatuses';
import { StorageService } from '../../src/services/storageService';

vi.mock('../../src/services/storageService', () => ({
  StorageService: {
    migrateOldStatusStructure: vi.fn(() => ({ watched: {}, liked: {} })),
    setVideoWatchedStatuses: vi.fn(),
    setVideoLikedStatuses: vi.fn(),
  },
}));

describe('useVideoStatuses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty statuses', () => {
      const { result } = renderHook(() => useVideoStatuses(false));

      expect(result.current.videoWatchedStatuses).toEqual({});
      expect(result.current.videoLikedStatuses).toEqual({});
    });

    it('should call migration on initialization', () => {
      renderHook(() => useVideoStatuses(true));

      expect(StorageService.migrateOldStatusStructure).toHaveBeenCalledWith(true);
    });
  });

  describe('toggleVideoWatchedStatus', () => {
    it('should mark video as watched when no status exists', () => {
      const { result } = renderHook(() => useVideoStatuses(false));

      act(() => {
        result.current.toggleVideoWatchedStatus('video-1');
      });

      expect(result.current.videoWatchedStatuses['video-1']).toBe('watched');
    });

    it('should change watched to watch_later', () => {
      const { result } = renderHook(() => useVideoStatuses(false));

      act(() => {
        result.current.toggleVideoWatchedStatus('video-1');
      });
      expect(result.current.videoWatchedStatuses['video-1']).toBe('watched');

      act(() => {
        result.current.toggleVideoWatchedStatus('video-1');
      });
      expect(result.current.videoWatchedStatuses['video-1']).toBe('watch_later');
    });

    it('should remove status when toggling from watch_later', () => {
      const { result } = renderHook(() => useVideoStatuses(false));

      act(() => {
        result.current.toggleVideoWatchedStatus('video-1');
      });
      act(() => {
        result.current.toggleVideoWatchedStatus('video-1');
      });
      act(() => {
        result.current.toggleVideoWatchedStatus('video-1');
      });

      expect(result.current.videoWatchedStatuses['video-1']).toBeUndefined();
    });

    it('should handle multiple videos independently', () => {
      const { result } = renderHook(() => useVideoStatuses(false));

      act(() => {
        result.current.toggleVideoWatchedStatus('video-1');
        result.current.toggleVideoWatchedStatus('video-2');
        result.current.toggleVideoWatchedStatus('video-2');
      });

      expect(result.current.videoWatchedStatuses['video-1']).toBe('watched');
      expect(result.current.videoWatchedStatuses['video-2']).toBe('watch_later');
    });
  });

  describe('toggleVideoLikedStatus', () => {
    it('should mark video as liked when no status exists', () => {
      const { result } = renderHook(() => useVideoStatuses(false));

      act(() => {
        result.current.toggleVideoLikedStatus('video-1');
      });

      expect(result.current.videoLikedStatuses['video-1']).toBe('liked');
    });

    it('should change liked to disliked', () => {
      const { result } = renderHook(() => useVideoStatuses(false));

      act(() => {
        result.current.toggleVideoLikedStatus('video-1');
      });
      expect(result.current.videoLikedStatuses['video-1']).toBe('liked');

      act(() => {
        result.current.toggleVideoLikedStatus('video-1');
      });
      expect(result.current.videoLikedStatuses['video-1']).toBe('disliked');
    });

    it('should remove status when toggling from disliked', () => {
      const { result } = renderHook(() => useVideoStatuses(false));

      act(() => {
        result.current.toggleVideoLikedStatus('video-1');
      });
      act(() => {
        result.current.toggleVideoLikedStatus('video-1');
      });
      act(() => {
        result.current.toggleVideoLikedStatus('video-1');
      });

      expect(result.current.videoLikedStatuses['video-1']).toBeUndefined();
    });
  });

  describe('updateWatchedStatus', () => {
    it('should set watched status', () => {
      const { result } = renderHook(() => useVideoStatuses(false));

      act(() => {
        result.current.updateWatchedStatus('video-1', 'watched');
      });

      expect(result.current.videoWatchedStatuses['video-1']).toBe('watched');
    });

    it('should set watch_later status', () => {
      const { result } = renderHook(() => useVideoStatuses(false));

      act(() => {
        result.current.updateWatchedStatus('video-1', 'watch_later');
      });

      expect(result.current.videoWatchedStatuses['video-1']).toBe('watch_later');
    });

    it('should remove status when undefined', () => {
      const { result } = renderHook(() => useVideoStatuses(false));

      act(() => {
        result.current.updateWatchedStatus('video-1', 'watched');
      });
      expect(result.current.videoWatchedStatuses['video-1']).toBe('watched');

      act(() => {
        result.current.updateWatchedStatus('video-1', undefined);
      });
      expect(result.current.videoWatchedStatuses['video-1']).toBeUndefined();
    });
  });

  describe('updateLikedStatus', () => {
    it('should set liked status', () => {
      const { result } = renderHook(() => useVideoStatuses(false));

      act(() => {
        result.current.updateLikedStatus('video-1', 'liked');
      });

      expect(result.current.videoLikedStatuses['video-1']).toBe('liked');
    });

    it('should set disliked status', () => {
      const { result } = renderHook(() => useVideoStatuses(false));

      act(() => {
        result.current.updateLikedStatus('video-1', 'disliked');
      });

      expect(result.current.videoLikedStatuses['video-1']).toBe('disliked');
    });

    it('should remove status when undefined', () => {
      const { result } = renderHook(() => useVideoStatuses(false));

      act(() => {
        result.current.updateLikedStatus('video-1', 'liked');
      });
      expect(result.current.videoLikedStatuses['video-1']).toBe('liked');

      act(() => {
        result.current.updateLikedStatus('video-1', undefined);
      });
      expect(result.current.videoLikedStatuses['video-1']).toBeUndefined();
    });
  });

  describe('setVideoWatchedStatuses', () => {
    it('should replace all watched statuses', () => {
      const { result } = renderHook(() => useVideoStatuses(false));

      act(() => {
        result.current.setVideoWatchedStatuses({
          'video-1': 'watched',
          'video-2': 'watch_later',
        });
      });

      expect(result.current.videoWatchedStatuses).toEqual({
        'video-1': 'watched',
        'video-2': 'watch_later',
      });
    });
  });

  describe('setVideoLikedStatuses', () => {
    it('should replace all liked statuses', () => {
      const { result } = renderHook(() => useVideoStatuses(false));

      act(() => {
        result.current.setVideoLikedStatuses({
          'video-1': 'liked',
          'video-2': 'disliked',
        });
      });

      expect(result.current.videoLikedStatuses).toEqual({
        'video-1': 'liked',
        'video-2': 'disliked',
      });
    });
  });

  describe('isLoggedIn prop', () => {
    it('should return isLoggedIn value', () => {
      const { result } = renderHook(() => useVideoStatuses(true));
      expect(result.current.isLoggedIn).toBe(true);
    });

    it('should return false for guest', () => {
      const { result } = renderHook(() => useVideoStatuses(false));
      expect(result.current.isLoggedIn).toBe(false);
    });
  });
});
