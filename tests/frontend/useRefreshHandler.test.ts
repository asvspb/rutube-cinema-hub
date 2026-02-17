import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRefreshHandler } from '../../src/hooks/useRefreshHandler';
import { CategoryDef } from '../../src/types';

describe('useRefreshHandler', () => {
  const mockCategory: CategoryDef = {
    id: 'cat-1',
    label: 'Test Category',
    rutubeId: '123',
    type: 'channel',
  };

  const mockHandleVideoRefresh = vi.fn();
  const mockSetCurrentPage = vi.fn();
  const mockRemoveFromCache = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('refreshKey', () => {
    it('should initialize with 0', () => {
      const { result } = renderHook(() =>
        useRefreshHandler({
          viewMode: 'home',
          activeCategory: null,
          handleVideoRefresh: mockHandleVideoRefresh,
          setCurrentPage: mockSetCurrentPage,
          removeFromCache: mockRemoveFromCache,
        })
      );

      expect(result.current.refreshKey).toBe(0);
    });
  });

  describe('handleRefresh', () => {
    it('should increment refreshKey in home mode', () => {
      const { result } = renderHook(() =>
        useRefreshHandler({
          viewMode: 'home',
          activeCategory: null,
          handleVideoRefresh: mockHandleVideoRefresh,
          setCurrentPage: mockSetCurrentPage,
          removeFromCache: mockRemoveFromCache,
        })
      );

      act(() => {
        result.current.handleRefresh();
      });

      expect(result.current.refreshKey).toBe(1);
      expect(mockHandleVideoRefresh).not.toHaveBeenCalled();
    });

    it('should call handleVideoRefresh in channel mode', () => {
      const { result } = renderHook(() =>
        useRefreshHandler({
          viewMode: 'channel',
          activeCategory: mockCategory,
          handleVideoRefresh: mockHandleVideoRefresh,
          setCurrentPage: mockSetCurrentPage,
          removeFromCache: mockRemoveFromCache,
        })
      );

      act(() => {
        result.current.handleRefresh(true);
      });

      expect(mockHandleVideoRefresh).toHaveBeenCalledWith(true);
    });

    it('should reset page to 1', () => {
      const { result } = renderHook(() =>
        useRefreshHandler({
          viewMode: 'channel',
          activeCategory: mockCategory,
          handleVideoRefresh: mockHandleVideoRefresh,
          setCurrentPage: mockSetCurrentPage,
          removeFromCache: mockRemoveFromCache,
        })
      );

      act(() => {
        result.current.handleRefresh();
      });

      expect(mockSetCurrentPage).toHaveBeenCalledWith(1);
    });

    it('should remove category from cache', () => {
      const { result } = renderHook(() =>
        useRefreshHandler({
          viewMode: 'channel',
          activeCategory: mockCategory,
          handleVideoRefresh: mockHandleVideoRefresh,
          setCurrentPage: mockSetCurrentPage,
          removeFromCache: mockRemoveFromCache,
        })
      );

      act(() => {
        result.current.handleRefresh();
      });

      expect(mockRemoveFromCache).toHaveBeenCalledWith('cat-1');
    });

    it('should not refresh if no active category in channel mode', () => {
      const { result } = renderHook(() =>
        useRefreshHandler({
          viewMode: 'channel',
          activeCategory: null,
          handleVideoRefresh: mockHandleVideoRefresh,
          setCurrentPage: mockSetCurrentPage,
          removeFromCache: mockRemoveFromCache,
        })
      );

      act(() => {
        result.current.handleRefresh();
      });

      expect(mockHandleVideoRefresh).not.toHaveBeenCalled();
      expect(mockSetCurrentPage).not.toHaveBeenCalled();
    });

    it('should increment refreshKey multiple times', () => {
      const { result } = renderHook(() =>
        useRefreshHandler({
          viewMode: 'home',
          activeCategory: null,
          handleVideoRefresh: mockHandleVideoRefresh,
          setCurrentPage: mockSetCurrentPage,
          removeFromCache: mockRemoveFromCache,
        })
      );

      act(() => {
        result.current.handleRefresh();
        result.current.handleRefresh();
        result.current.handleRefresh();
      });

      expect(result.current.refreshKey).toBe(3);
    });
  });
});
