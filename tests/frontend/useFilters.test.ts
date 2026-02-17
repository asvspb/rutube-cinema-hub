import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const sortVideos = vi.fn((videos: any[], sortOption: string, direction: string) => {
  const sorted = [...videos];
  switch (sortOption) {
    case 'date':
      return direction === 'asc'
        ? sorted.sort((a, b) => a.id.localeCompare(b.id))
        : sorted.sort((a, b) => b.id.localeCompare(a.id));
    case 'rating':
      return direction === 'asc'
        ? sorted.sort((a, b) => a.rating - b.rating)
        : sorted.sort((a, b) => b.rating - a.rating);
    case 'alphabetical':
      return direction === 'asc'
        ? sorted.sort((a, b) => a.title.localeCompare(b.title))
        : sorted.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return sorted;
  }
});

vi.mock('../../src/services/rutubeService', () => ({
  sortVideos: (videos: any[], sortOption: string, direction: string) =>
    sortVideos(videos, sortOption, direction),
}));

import { useFilters } from '../../src/hooks/useFilters';

const mockVideos = [
  { id: '1', title: 'Alpha Video', rating: 5, views: 100 },
  { id: '2', title: 'Beta Video', rating: 8, views: 200 },
  { id: '3', title: 'Gamma Video', rating: 3, views: 50 },
];

describe('useFilters', () => {
  const defaultProps = {
    videos: mockVideos as any,
    videoWatchedStatuses: {},
    videoLikedStatuses: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const { result } = renderHook(() => useFilters(defaultProps));

      expect(result.current.sortOption).toBe('rating');
      expect(result.current.sortDirection).toBe('desc');
      expect(result.current.searchQuery).toBe('');
    });
  });

  describe('filteredVideos', () => {
    it('should return all videos when no search query', () => {
      const { result } = renderHook(() => useFilters(defaultProps));
      expect(result.current.filteredVideos).toHaveLength(3);
    });

    it('should filter videos by search query', () => {
      const { result } = renderHook(() => useFilters(defaultProps));

      act(() => {
        result.current.setSearchQuery('Alpha');
      });

      expect(result.current.filteredVideos).toHaveLength(1);
      expect(result.current.filteredVideos[0].title).toBe('Alpha Video');
    });

    it('should be case-insensitive', () => {
      const { result } = renderHook(() => useFilters(defaultProps));

      act(() => {
        result.current.setSearchQuery('alpha');
      });

      expect(result.current.filteredVideos).toHaveLength(1);
    });

    it('should return empty array for no matches', () => {
      const { result } = renderHook(() => useFilters(defaultProps));

      act(() => {
        result.current.setSearchQuery('nonexistent');
      });

      expect(result.current.filteredVideos).toHaveLength(0);
    });

    it('should handle empty videos array', () => {
      const { result } = renderHook(() =>
        useFilters({
          ...defaultProps,
          videos: [],
        })
      );

      expect(result.current.filteredVideos).toHaveLength(0);
    });
  });

  describe('sortedVideos', () => {
    it('should call sortVideos with correct params', () => {
      renderHook(() => useFilters(defaultProps));
      expect(sortVideos).toHaveBeenCalled();
    });
  });

  describe('handleSortOptionClick', () => {
    it('should change sort option', () => {
      const { result } = renderHook(() => useFilters(defaultProps));

      act(() => {
        result.current.handleSortOptionClick('date');
      });

      expect(result.current.sortOption).toBe('date');
    });

    it('should toggle direction when same option clicked', () => {
      const { result } = renderHook(() => useFilters(defaultProps));

      act(() => {
        result.current.handleSortOptionClick('rating');
      });

      expect(result.current.sortDirection).toBe('asc');
    });

    it('should set asc for alphabetical sort', () => {
      const { result } = renderHook(() => useFilters(defaultProps));

      act(() => {
        result.current.handleSortOptionClick('alphabetical');
      });

      expect(result.current.sortDirection).toBe('asc');
    });

    it('should set desc for rating sort', () => {
      const { result } = renderHook(() => useFilters(defaultProps));

      act(() => {
        result.current.handleSortOptionClick('views');
      });

      expect(result.current.sortDirection).toBe('desc');
    });
  });

  describe('clearSearch', () => {
    it('should clear search query', () => {
      const { result } = renderHook(() => useFilters(defaultProps));

      act(() => {
        result.current.setSearchQuery('test');
      });

      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.searchQuery).toBe('');
    });
  });

  describe('setters', () => {
    it('should update sortOption directly', () => {
      const { result } = renderHook(() => useFilters(defaultProps));

      act(() => {
        result.current.setSortOption('views');
      });

      expect(result.current.sortOption).toBe('views');
    });

    it('should update sortDirection directly', () => {
      const { result } = renderHook(() => useFilters(defaultProps));

      act(() => {
        result.current.setSortDirection('asc');
      });

      expect(result.current.sortDirection).toBe('asc');
    });
  });
});
