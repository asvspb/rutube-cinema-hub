import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '../../src/hooks/useSearch';

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.isSearchOpen).toBe(false);
      expect(result.current.searchQuery).toBe('');
    });
  });

  describe('setIsSearchOpen', () => {
    it('should update isSearchOpen', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setIsSearchOpen(true);
      });

      expect(result.current.isSearchOpen).toBe(true);
    });
  });

  describe('setSearchQuery', () => {
    it('should update searchQuery', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setSearchQuery('test query');
      });

      expect(result.current.searchQuery).toBe('test query');
    });
  });

  describe('toggleSearch', () => {
    it('should open search when closed', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.toggleSearch();
      });

      expect(result.current.isSearchOpen).toBe(true);
    });

    it('should close search and clear query when open', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setIsSearchOpen(true);
        result.current.setSearchQuery('query');
      });

      act(() => {
        result.current.toggleSearch();
      });

      expect(result.current.isSearchOpen).toBe(false);
      expect(result.current.searchQuery).toBe('');
    });
  });

  describe('clearSearch', () => {
    it('should clear search query and close', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setSearchQuery('test');
        result.current.setIsSearchOpen(true);
      });

      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.searchQuery).toBe('');
      expect(result.current.isSearchOpen).toBe(false);
    });
  });

  describe('searchInputRef', () => {
    it('should provide ref', () => {
      const { result } = renderHook(() => useSearch());
      expect(result.current.searchInputRef).toBeDefined();
    });
  });
});
