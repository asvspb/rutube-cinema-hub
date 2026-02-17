import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../../src/hooks/usePagination';

const ITEMS_PER_PAGE = 50;

describe('usePagination', () => {
  const mockVideos = Array.from({ length: 150 }, (_, i) => ({
    id: `video-${i}`,
    title: `Video ${i}`,
    description: '',
    thumbnail_url: '',
    duration: 0,
    views: 0,
    created_ts: '',
    video_url: '',
    html: '',
    rating: 0,
    gravity: 0,
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start at page 1', () => {
      const { result } = renderHook(() => usePagination({ sortedVideos: [] }));
      expect(result.current.currentPage).toBe(1);
    });

    it('should have 0 total pages for empty array', () => {
      const { result } = renderHook(() => usePagination({ sortedVideos: [] }));
      expect(result.current.totalPages).toBe(0);
    });
  });

  describe('totalPages', () => {
    it('should calculate correct total pages', () => {
      const { result } = renderHook(() => usePagination({ sortedVideos: mockVideos }));
      expect(result.current.totalPages).toBe(3);
    });

    it('should have 1 page for less than ITEMS_PER_PAGE items', () => {
      const smallList = mockVideos.slice(0, 30);
      const { result } = renderHook(() => usePagination({ sortedVideos: smallList }));
      expect(result.current.totalPages).toBe(1);
    });

    it('should round up for partial pages', () => {
      const partialList = mockVideos.slice(0, 75);
      const { result } = renderHook(() => usePagination({ sortedVideos: partialList }));
      expect(result.current.totalPages).toBe(2);
    });
  });

  describe('displayedVideos', () => {
    it('should return all videos when less than ITEMS_PER_PAGE', () => {
      const smallList = mockVideos.slice(0, 30);
      const { result } = renderHook(() => usePagination({ sortedVideos: smallList }));
      expect(result.current.displayedVideos).toHaveLength(30);
    });

    it('should return first page by default', () => {
      const { result } = renderHook(() => usePagination({ sortedVideos: mockVideos }));
      expect(result.current.displayedVideos).toHaveLength(ITEMS_PER_PAGE);
      expect(result.current.displayedVideos[0].id).toBe('video-0');
    });

    it('should return correct page after page change', () => {
      const { result } = renderHook(() => usePagination({ sortedVideos: mockVideos }));

      act(() => {
        result.current.setCurrentPage(2);
      });

      expect(result.current.displayedVideos).toHaveLength(ITEMS_PER_PAGE);
      expect(result.current.displayedVideos[0].id).toBe('video-50');
    });

    it('should return partial last page', () => {
      const partialList = mockVideos.slice(0, 75);
      const { result } = renderHook(() => usePagination({ sortedVideos: partialList }));

      act(() => {
        result.current.setCurrentPage(2);
      });

      expect(result.current.displayedVideos).toHaveLength(25);
    });
  });

  describe('handlePageChange', () => {
    it('should update current page', () => {
      const { result } = renderHook(() => usePagination({ sortedVideos: mockVideos }));

      act(() => {
        result.current.handlePageChange(2);
      });

      expect(result.current.currentPage).toBe(2);
    });

    it('should scroll to top', () => {
      const { result } = renderHook(() => usePagination({ sortedVideos: mockVideos }));

      act(() => {
        result.current.handlePageChange(2);
      });

      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });

  describe('ITEMS_PER_PAGE export', () => {
    it('should export constant', () => {
      const { result } = renderHook(() => usePagination({ sortedVideos: [] }));
      expect(result.current.ITEMS_PER_PAGE).toBe(50);
    });
  });
});
