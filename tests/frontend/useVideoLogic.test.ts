import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVideoLogic } from '../../src/hooks/useVideoLogic';
import { fetchVideos } from '../../src/services/rutubeService';
import type { CategoryDef, RutubeVideo, RatingSettings, CachedPlaylistData } from '../../src/types';

vi.mock('../../src/services/rutubeService', () => ({
  fetchVideos: vi.fn(),
}));

const mockVideo: RutubeVideo = {
  id: 'video-1',
  title: 'Test Video',
  description: 'Test Description',
  thumbnail_url: 'https://example.com/thumb.jpg',
  duration: 3600,
  views: 1000,
  created_ts: '2024-01-01T12:00:00Z',
  video_url: 'https://example.com/video',
  html: '<iframe src="https://example.com/embed"></iframe>',
} as RutubeVideo;

const mockCategory: CategoryDef = {
  id: 'cat-1',
  label: 'Test Category',
  rutubeId: '123456',
  type: 'channel',
};

const defaultRatingSettings: RatingSettings = {
  ratingBase: 5,
  ratingLogScale: 2,
  gravityHourOffset: 1,
  gravityPower: 1.5,
  useExperimentalStrategy: false,
  thresholdLow: 100,
  thresholdHigh: 10000,
};

describe('useVideoLogic', () => {
  let setVideosMock: ReturnType<typeof vi.fn>;
  let setIsVideoLoadingMock: ReturnType<typeof vi.fn>;
  let setNextPageUrlMock: ReturnType<typeof vi.fn>;
  let getFromCacheMock: ReturnType<typeof vi.fn>;
  let addToCacheMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    setVideosMock = vi.fn();
    setIsVideoLoadingMock = vi.fn();
    setNextPageUrlMock = vi.fn();
    getFromCacheMock = vi.fn(() => undefined);
    addToCacheMock = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderUseVideoLogic = (overrides = {}) => {
    return renderHook(() =>
      useVideoLogic({
        activeCategory: mockCategory,
        refreshKey: 0,
        isChannelLoading: false,
        viewMode: 'channel',
        channels: [],
        ratingSettings: defaultRatingSettings,
        getFromCache: getFromCacheMock,
        addToCache: addToCacheMock,
        setVideos: setVideosMock,
        setIsVideoLoading: setIsVideoLoadingMock,
        setNextPageUrl: setNextPageUrlMock,
        ...overrides,
      })
    );
  };

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderUseVideoLogic();

      expect(result.current.isLoadingMore).toBe(false);
      expect(result.current.isFetchAllMode).toBe(false);
    });
  });

  describe('channel video loading', () => {
    it('should fetch videos when activeCategory is set', async () => {
      vi.mocked(fetchVideos).mockResolvedValueOnce({
        videos: [mockVideo],
        nextUrl: null,
      });

      renderUseVideoLogic();

      await waitFor(() => {
        expect(fetchVideos).toHaveBeenCalledWith(
          mockCategory,
          defaultRatingSettings,
          null,
          false,
          expect.any(Object)
        );
      });

      await waitFor(() => {
        expect(setVideosMock).toHaveBeenCalledWith([mockVideo]);
      });
    });

    it('should not fetch when isChannelLoading is true', async () => {
      renderUseVideoLogic({ isChannelLoading: true });

      // Wait a bit to ensure no fetch happens
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(fetchVideos).not.toHaveBeenCalled();
    });

    it('should use cached data if available', async () => {
      const cachedData: CachedPlaylistData = {
        data: [mockVideo],
        nextUrl: 'https://example.com/next',
      };
      getFromCacheMock.mockReturnValue(cachedData);

      renderUseVideoLogic();

      await waitFor(() => {
        expect(setVideosMock).toHaveBeenCalledWith([mockVideo]);
        expect(setNextPageUrlMock).toHaveBeenCalledWith('https://example.com/next');
      });

      expect(fetchVideos).not.toHaveBeenCalled();
    });

    it('should set loading state during fetch', async () => {
      let resolveFetch: (value: any) => void;
      vi.mocked(fetchVideos).mockImplementation(
        () =>
          new Promise(resolve => {
            resolveFetch = resolve;
          })
      );

      renderUseVideoLogic();

      await waitFor(() => {
        expect(setIsVideoLoadingMock).toHaveBeenCalledWith(true);
      });

      // Resolve the fetch
      resolveFetch!({ videos: [mockVideo], nextUrl: null });

      await waitFor(() => {
        expect(setIsVideoLoadingMock).toHaveBeenCalledWith(false);
      });
    });

    it('should handle fetch errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(fetchVideos).mockRejectedValueOnce(new Error('Network error'));

      renderUseVideoLogic();

      await waitFor(() => {
        expect(setVideosMock).toHaveBeenCalledWith([]);
        expect(setNextPageUrlMock).toHaveBeenCalledWith(null);
      });

      expect(setIsVideoLoadingMock).toHaveBeenCalledWith(false);
      consoleSpy.mockRestore();
    });

    it('should cache fetched videos', async () => {
      vi.mocked(fetchVideos).mockResolvedValueOnce({
        videos: [mockVideo],
        nextUrl: 'https://example.com/next',
      });

      renderUseVideoLogic();

      await waitFor(() => {
        expect(addToCacheMock).toHaveBeenCalledWith(mockCategory.id, {
          data: [mockVideo],
          nextUrl: 'https://example.com/next',
        });
      });
    });
  });

  describe('home view mode', () => {
    it('should clear videos when switching to home mode', async () => {
      renderUseVideoLogic({ viewMode: 'home', channels: [] });

      await waitFor(() => {
        expect(setVideosMock).toHaveBeenCalledWith([]);
      });
    });

    it('should set loading state in home mode', async () => {
      renderUseVideoLogic({ viewMode: 'home', channels: [] });

      await waitFor(() => {
        expect(setIsVideoLoadingMock).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('handleRefresh', () => {
    it('should clear cache for active category', async () => {
      const { result } = renderUseVideoLogic();

      act(() => {
        result.current.handleRefresh(false);
      });

      expect(addToCacheMock).toHaveBeenCalledWith(mockCategory.id, {
        data: [],
        nextUrl: null,
      });
    });

    it('should set fetchAll mode when called with true', async () => {
      const { result } = renderUseVideoLogic();

      act(() => {
        result.current.handleRefresh(true);
      });

      expect(result.current.isFetchAllMode).toBe(true);
    });

    it('should not refresh when no active category and not home mode', async () => {
      const { result } = renderUseVideoLogic({
        activeCategory: null,
        viewMode: 'channel',
      });

      act(() => {
        result.current.handleRefresh(false);
      });

      expect(addToCacheMock).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should not throw on unmount during fetch', async () => {
      vi.mocked(fetchVideos).mockImplementation(
        async () =>
          new Promise(resolve => {
            setTimeout(() => resolve({ videos: [mockVideo], nextUrl: null }), 100);
          })
      );

      const { unmount } = renderUseVideoLogic();

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('playlist mode', () => {
    it('should fetch all videos for playlist type', async () => {
      const playlistCategory: CategoryDef = {
        ...mockCategory,
        type: 'playlist',
      };

      vi.mocked(fetchVideos).mockResolvedValueOnce({
        videos: [mockVideo],
        nextUrl: null,
      });

      renderUseVideoLogic({ activeCategory: playlistCategory });

      await waitFor(() => {
        expect(fetchVideos).toHaveBeenCalledWith(
          playlistCategory,
          defaultRatingSettings,
          null,
          true,
          expect.any(Object)
        );
      });
    });
  });

  describe('empty category', () => {
    it('should clear videos when no active category in channel mode', async () => {
      renderUseVideoLogic({ activeCategory: null, viewMode: 'channel' });

      await waitFor(() => {
        expect(setVideosMock).toHaveBeenCalledWith([]);
        expect(setNextPageUrlMock).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('handleLoadMore', () => {
    it('should not load more in home mode', async () => {
      const { result } = renderUseVideoLogic({ viewMode: 'home' });

      await act(async () => {
        await result.current.handleLoadMore();
      });

      // fetchVideos is called for each channel during home mode initialization
      // handleLoadMore should return early in home mode
      expect(result.current.isLoadingMore).toBe(false);
    });

    it('should not load more when already loading', async () => {
      vi.mocked(fetchVideos).mockResolvedValueOnce({
        videos: [mockVideo],
        nextUrl: null,
      });

      const { result } = renderUseVideoLogic();

      // Set loading state manually
      act(() => {
        result.current.setIsLoadingMore(true);
      });

      // The isLoadingMore flag should prevent handleLoadMore from calling fetchVideos
      const initialCallCount = vi.mocked(fetchVideos).mock.calls.length;

      await act(async () => {
        await result.current.handleLoadMore();
      });

      // fetchVideos call count should not have increased
      expect(vi.mocked(fetchVideos).mock.calls.length).toBe(initialCallCount);
    });
  });
});
