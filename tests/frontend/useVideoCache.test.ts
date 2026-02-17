import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVideoCache } from '../../src/hooks/useVideoCache';

describe('useVideoCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start with empty cache', () => {
      const { result } = renderHook(() => useVideoCache());
      expect(result.current.videoCache).toEqual({});
    });
  });

  describe('addToCache', () => {
    it('should add item to cache', () => {
      const { result } = renderHook(() => useVideoCache());

      act(() => {
        result.current.addToCache('category-1', { data: [{ id: '1' }] as any, nextUrl: null });
      });

      expect(result.current.videoCache['category-1']).toEqual({
        data: [{ id: '1' }],
        nextUrl: null,
      });
    });

    it('should preserve existing items when adding new', () => {
      const { result } = renderHook(() => useVideoCache());

      act(() => {
        result.current.addToCache('category-1', { data: [{ id: '1' }] as any, nextUrl: null });
      });

      act(() => {
        result.current.addToCache('category-2', { data: [{ id: '2' }] as any, nextUrl: 'url' });
      });

      expect(Object.keys(result.current.videoCache)).toHaveLength(2);
      expect(result.current.videoCache['category-1']).toBeDefined();
      expect(result.current.videoCache['category-2']).toBeDefined();
    });

    it('should update existing item', () => {
      const { result } = renderHook(() => useVideoCache());

      act(() => {
        result.current.addToCache('category-1', { data: [{ id: '1' }] as any, nextUrl: null });
      });

      act(() => {
        result.current.addToCache('category-1', {
          data: [{ id: '1' }, { id: '2' }] as any,
          nextUrl: 'next',
        });
      });

      expect(result.current.videoCache['category-1'].data).toHaveLength(2);
      expect(result.current.videoCache['category-1'].nextUrl).toBe('next');
    });
  });

  describe('removeFromCache', () => {
    it('should remove item from cache', () => {
      const { result } = renderHook(() => useVideoCache());

      act(() => {
        result.current.addToCache('category-1', { data: [] as any, nextUrl: null });
      });

      act(() => {
        result.current.removeFromCache('category-1');
      });

      expect(result.current.videoCache['category-1']).toBeUndefined();
    });

    it('should not affect other items', () => {
      const { result } = renderHook(() => useVideoCache());

      act(() => {
        result.current.addToCache('category-1', { data: [] as any, nextUrl: null });
        result.current.addToCache('category-2', { data: [] as any, nextUrl: null });
      });

      act(() => {
        result.current.removeFromCache('category-1');
      });

      expect(result.current.videoCache['category-1']).toBeUndefined();
      expect(result.current.videoCache['category-2']).toBeDefined();
    });
  });

  describe('getFromCache', () => {
    it('should return undefined for non-existent key', () => {
      const { result } = renderHook(() => useVideoCache());
      expect(result.current.getFromCache('non-existent')).toBeUndefined();
    });

    it('should return cached item', () => {
      const { result } = renderHook(() => useVideoCache());

      const testData = { data: [{ id: 'test' }] as any, nextUrl: 'test-url' };

      act(() => {
        result.current.addToCache('category-1', testData);
      });

      expect(result.current.getFromCache('category-1')).toEqual(testData);
    });

    it('should return latest value after update', () => {
      const { result } = renderHook(() => useVideoCache());

      act(() => {
        result.current.addToCache('category-1', { data: [] as any, nextUrl: null });
      });

      const updatedData = { data: [{ id: 'new' }] as any, nextUrl: 'new-url' };
      act(() => {
        result.current.addToCache('category-1', updatedData);
      });

      expect(result.current.getFromCache('category-1')).toEqual(updatedData);
    });
  });

  describe('clearCache', () => {
    it('should clear all items', () => {
      const { result } = renderHook(() => useVideoCache());

      act(() => {
        result.current.addToCache('category-1', { data: [] as any, nextUrl: null });
        result.current.addToCache('category-2', { data: [] as any, nextUrl: null });
        result.current.addToCache('category-3', { data: [] as any, nextUrl: null });
      });

      act(() => {
        result.current.clearCache();
      });

      expect(result.current.videoCache).toEqual({});
    });
  });

  describe('stability', () => {
    it('should return stable getFromCache reference', () => {
      const { result, rerender } = renderHook(() => useVideoCache());

      const firstRef = result.current.getFromCache;
      rerender();
      const secondRef = result.current.getFromCache;

      expect(firstRef).toBe(secondRef);
    });

    it('should return stable addToCache reference', () => {
      const { result, rerender } = renderHook(() => useVideoCache());

      const firstRef = result.current.addToCache;
      rerender();
      const secondRef = result.current.addToCache;

      expect(firstRef).toBe(secondRef);
    });
  });
});
