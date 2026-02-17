import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUIState } from '../../src/hooks/useUIState';

describe('useUIState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.isGridMenuOpen).toBe(false);
      expect(result.current.isUserMenuOpen).toBe(false);
      expect(result.current.isSortMenuOpen).toBe(false);
      expect(result.current.activeChannelMenuId).toBe(null);
      expect(result.current.channelMenuPosition).toBe(null);
      expect(result.current.isEditingChannel).toBe(false);
      expect(result.current.channelEditName).toBe('');
    });
  });

  describe('setters', () => {
    it('should update isGridMenuOpen', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setIsGridMenuOpen(true);
      });

      expect(result.current.isGridMenuOpen).toBe(true);
    });

    it('should update isUserMenuOpen', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setIsUserMenuOpen(true);
      });

      expect(result.current.isUserMenuOpen).toBe(true);
    });

    it('should update isSortMenuOpen', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setIsSortMenuOpen(true);
      });

      expect(result.current.isSortMenuOpen).toBe(true);
    });

    it('should update activeChannelMenuId', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setActiveChannelMenuId('channel-123');
      });

      expect(result.current.activeChannelMenuId).toBe('channel-123');
    });

    it('should update isEditingChannel', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setIsEditingChannel(true);
      });

      expect(result.current.isEditingChannel).toBe(true);
    });

    it('should update channelEditName', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setChannelEditName('New Name');
      });

      expect(result.current.channelEditName).toBe('New Name');
    });
  });

  describe('closeChannelMenu', () => {
    it('should reset channel menu state', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setActiveChannelMenuId('channel-1');
        result.current.setChannelMenuPosition({ top: 100, left: 100 });
        result.current.setIsEditingChannel(true);
      });

      act(() => {
        result.current.closeChannelMenu();
      });

      expect(result.current.activeChannelMenuId).toBe(null);
      expect(result.current.channelMenuPosition).toBe(null);
      expect(result.current.isEditingChannel).toBe(false);
    });
  });

  describe('handleChannelMenuTrigger', () => {
    it('should set menu position from element', () => {
      const { result } = renderHook(() => useUIState());

      const mockElement = {
        getBoundingClientRect: () => ({
          left: 100,
          right: 200,
          width: 100,
          bottom: 50,
        }),
        getAttribute: (attr: string) => {
          if (attr === 'data-channel-id') return 'test-channel';
          if (attr === 'data-channel-name') return 'Test Channel';
          return null;
        },
      } as unknown as HTMLElement;

      const mockEvent = {
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleChannelMenuTrigger(mockEvent, mockElement);
      });

      expect(result.current.activeChannelMenuId).toBe('test-channel');
      expect(result.current.channelEditName).toBe('Test Channel');
      expect(result.current.channelMenuPosition).not.toBe(null);
    });

    it('should adjust position to stay within viewport', () => {
      const { result } = renderHook(() => useUIState());

      const mockElement = {
        getBoundingClientRect: () => ({
          left: -100,
          right: 0,
          width: 100,
          bottom: 50,
        }),
        getAttribute: () => null,
      } as unknown as HTMLElement;

      const mockEvent = {
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleChannelMenuTrigger(mockEvent, mockElement);
      });

      expect(result.current.channelMenuPosition?.left).toBeGreaterThanOrEqual(16);
    });
  });

  describe('refs', () => {
    it('should provide refs', () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.channelMenuRef).toBeDefined();
      expect(result.current.channelInputRef).toBeDefined();
      expect(result.current.sortMenuRef).toBeDefined();
      expect(result.current.gridMenuRef).toBeDefined();
      expect(result.current.userMenuRef).toBeDefined();
    });
  });
});
