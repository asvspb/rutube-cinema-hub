import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSortingAndGrid } from '../../src/hooks/useSortingAndGrid';
import { StorageService } from '../../src/services/storageService';
import { RatingSettings, SortOption } from '../../src/types';

vi.mock('../../src/services/storageService', () => ({
  StorageService: {
    getGridColumns: vi.fn(() => 3),
    setGridColumns: vi.fn(),
    setRatingSettings: vi.fn(),
  },
}));

describe('useSortingAndGrid', () => {
  const defaultRatingSettings: RatingSettings = {
    ratingBase: 5.0,
    ratingLogScale: 1.0,
    gravityHourOffset: 2.0,
    gravityPower: 1.5,
    useExperimentalStrategy: false,
    thresholdLow: 50000,
    thresholdHigh: 500000,
  };

  const mockSetRatingSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should load grid columns from storage', () => {
      vi.mocked(StorageService.getGridColumns).mockReturnValue(4);

      const { result } = renderHook(() =>
        useSortingAndGrid({
          ratingSettings: defaultRatingSettings,
          setRatingSettings: mockSetRatingSettings,
        })
      );

      expect(result.current.gridColumns).toBe(4);
    });

    it('should initialize with rating sort option', () => {
      const { result } = renderHook(() =>
        useSortingAndGrid({
          ratingSettings: defaultRatingSettings,
          setRatingSettings: mockSetRatingSettings,
        })
      );

      expect(result.current.sortOption).toBe('rating');
    });

    it('should initialize with desc sort direction', () => {
      const { result } = renderHook(() =>
        useSortingAndGrid({
          ratingSettings: defaultRatingSettings,
          setRatingSettings: mockSetRatingSettings,
        })
      );

      expect(result.current.sortDirection).toBe('desc');
    });
  });

  describe('handleSortOptionClick', () => {
    it('should change sort option', () => {
      const { result } = renderHook(() =>
        useSortingAndGrid({
          ratingSettings: defaultRatingSettings,
          setRatingSettings: mockSetRatingSettings,
        })
      );

      act(() => {
        result.current.handleSortOptionClick('views');
      });

      expect(result.current.sortOption).toBe('views');
    });

    it('should toggle direction when clicking same option', () => {
      const { result } = renderHook(() =>
        useSortingAndGrid({
          ratingSettings: defaultRatingSettings,
          setRatingSettings: mockSetRatingSettings,
        })
      );

      expect(result.current.sortDirection).toBe('desc');

      act(() => {
        result.current.handleSortOptionClick('rating');
      });

      expect(result.current.sortDirection).toBe('asc');

      act(() => {
        result.current.handleSortOptionClick('rating');
      });

      expect(result.current.sortDirection).toBe('desc');
    });

    it('should set asc for alphabetical sort', () => {
      const { result } = renderHook(() =>
        useSortingAndGrid({
          ratingSettings: defaultRatingSettings,
          setRatingSettings: mockSetRatingSettings,
        })
      );

      act(() => {
        result.current.handleSortOptionClick('alphabetical');
      });

      expect(result.current.sortOption).toBe('alphabetical');
      expect(result.current.sortDirection).toBe('asc');
    });

    it('should set asc for default sort', () => {
      const { result } = renderHook(() =>
        useSortingAndGrid({
          ratingSettings: defaultRatingSettings,
          setRatingSettings: mockSetRatingSettings,
        })
      );

      act(() => {
        result.current.handleSortOptionClick('default');
      });

      expect(result.current.sortOption).toBe('default');
      expect(result.current.sortDirection).toBe('asc');
    });

    it('should set desc for trend sort', () => {
      const { result } = renderHook(() =>
        useSortingAndGrid({
          ratingSettings: defaultRatingSettings,
          setRatingSettings: mockSetRatingSettings,
        })
      );

      act(() => {
        result.current.handleSortOptionClick('trend');
      });

      expect(result.current.sortOption).toBe('trend');
      expect(result.current.sortDirection).toBe('desc');
    });

    it('should set desc for views sort', () => {
      const { result } = renderHook(() =>
        useSortingAndGrid({
          ratingSettings: defaultRatingSettings,
          setRatingSettings: mockSetRatingSettings,
        })
      );

      act(() => {
        result.current.handleSortOptionClick('views');
      });

      expect(result.current.sortDirection).toBe('desc');
    });

    it('should set desc for date sort', () => {
      const { result } = renderHook(() =>
        useSortingAndGrid({
          ratingSettings: defaultRatingSettings,
          setRatingSettings: mockSetRatingSettings,
        })
      );

      act(() => {
        result.current.handleSortOptionClick('date');
      });

      expect(result.current.sortDirection).toBe('desc');
    });
  });

  describe('setGridColumns', () => {
    it('should update grid columns', () => {
      const { result } = renderHook(() =>
        useSortingAndGrid({
          ratingSettings: defaultRatingSettings,
          setRatingSettings: mockSetRatingSettings,
        })
      );

      act(() => {
        result.current.setGridColumns(2);
      });

      expect(result.current.gridColumns).toBe(2);
    });

    it('should persist grid columns to storage', () => {
      const { result } = renderHook(() =>
        useSortingAndGrid({
          ratingSettings: defaultRatingSettings,
          setRatingSettings: mockSetRatingSettings,
        })
      );

      act(() => {
        result.current.setGridColumns(4);
      });

      expect(StorageService.setGridColumns).toHaveBeenCalledWith(4);
    });
  });

  describe('setSortOption', () => {
    it('should update sort option directly', () => {
      const { result } = renderHook(() =>
        useSortingAndGrid({
          ratingSettings: defaultRatingSettings,
          setRatingSettings: mockSetRatingSettings,
        })
      );

      act(() => {
        result.current.setSortOption('year');
      });

      expect(result.current.sortOption).toBe('year');
    });
  });

  describe('setSortDirection', () => {
    it('should update sort direction directly', () => {
      const { result } = renderHook(() =>
        useSortingAndGrid({
          ratingSettings: defaultRatingSettings,
          setRatingSettings: mockSetRatingSettings,
        })
      );

      act(() => {
        result.current.setSortDirection('asc');
      });

      expect(result.current.sortDirection).toBe('asc');
    });
  });

  describe('sortOptionsList', () => {
    it('should provide list of sort options', () => {
      const { result } = renderHook(() =>
        useSortingAndGrid({
          ratingSettings: defaultRatingSettings,
          setRatingSettings: mockSetRatingSettings,
        })
      );

      expect(result.current.sortOptionsList).toHaveLength(10);
      expect(result.current.sortOptionsList[0]).toEqual({
        id: 'default',
        label: 'Сортировка rutube',
      });
      expect(result.current.sortOptionsList[1]).toEqual({ id: 'trend', label: 'В тренде' });
    });
  });

  describe('gridOptionsList', () => {
    it('should provide list of grid options', () => {
      const { result } = renderHook(() =>
        useSortingAndGrid({
          ratingSettings: defaultRatingSettings,
          setRatingSettings: mockSetRatingSettings,
        })
      );

      expect(result.current.gridOptionsList).toHaveLength(3);
      expect(result.current.gridOptionsList[0]).toEqual({ count: 2, label: '2 колонки' });
      expect(result.current.gridOptionsList[2]).toEqual({ count: 4, label: '4 колонки' });
    });
  });
});
