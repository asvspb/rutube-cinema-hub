import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGridClass } from '../../src/hooks/useGridClass';

describe('useGridClass', () => {
  describe('initialization', () => {
    it('should initialize with provided grid columns', () => {
      const { result } = renderHook(() => useGridClass(2));
      expect(result.current.gridColumns).toBe(2);
    });

    it('should default to provided value', () => {
      const { result } = renderHook(() => useGridClass(3));
      expect(result.current.gridColumns).toBe(3);
    });
  });

  describe('getGridClass', () => {
    it('should return 2-column grid class', () => {
      const { result } = renderHook(() => useGridClass(2));
      expect(result.current.getGridClass()).toBe('grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8');
    });

    it('should return 3-column grid class', () => {
      const { result } = renderHook(() => useGridClass(3));
      expect(result.current.getGridClass()).toBe(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8'
      );
    });

    it('should return 4-column grid class', () => {
      const { result } = renderHook(() => useGridClass(4));
      expect(result.current.getGridClass()).toBe(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8'
      );
    });
  });

  describe('setGridColumns', () => {
    it('should update grid columns', () => {
      const { result } = renderHook(() => useGridClass(2));

      act(() => {
        result.current.setGridColumns(4);
      });

      expect(result.current.gridColumns).toBe(4);
    });

    it('should update grid class when columns change', () => {
      const { result } = renderHook(() => useGridClass(2));
      expect(result.current.getGridClass()).toContain('sm:grid-cols-2');
      expect(result.current.getGridClass()).not.toContain('lg:grid-cols-3');

      act(() => {
        result.current.setGridColumns(3);
      });

      expect(result.current.getGridClass()).toContain('lg:grid-cols-3');
    });
  });
});
