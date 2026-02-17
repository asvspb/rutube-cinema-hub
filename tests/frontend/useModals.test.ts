import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModals } from '../../src/hooks/useModals';
import { RutubeVideo, ChannelDef } from '../../src/types';

describe('useModals', () => {
  const mockVideo: RutubeVideo = {
    id: '123',
    title: 'Test Video',
    description: 'Test Description',
    thumbnail_url: 'http://example.com/thumb.jpg',
    duration: 3600,
    views: 1000,
    created_ts: '2024-01-01',
    video_url: 'http://example.com/video',
    html: '<iframe></iframe>',
    rating: 8.5,
    gravity: 5.2,
  };

  const mockChannel: ChannelDef = {
    id: 'channel-1',
    label: 'Test Channel',
    rutubeId: '12345',
  };

  describe('Video modal', () => {
    it('should initialize with no selected video', () => {
      const { result } = renderHook(() => useModals());
      expect(result.current.selectedVideo).toBeNull();
    });

    it('should set selected video', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.setSelectedVideo(mockVideo);
      });

      expect(result.current.selectedVideo).toEqual(mockVideo);
    });

    it('should clear selected video', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.setSelectedVideo(mockVideo);
      });
      expect(result.current.selectedVideo).toEqual(mockVideo);

      act(() => {
        result.current.setSelectedVideo(null);
      });
      expect(result.current.selectedVideo).toBeNull();
    });
  });

  describe('Add playlist modal', () => {
    it('should initialize closed', () => {
      const { result } = renderHook(() => useModals());
      expect(result.current.isAddPlaylistModalOpen).toBe(false);
    });

    it('should open and close modal', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.setIsAddPlaylistModalOpen(true);
      });
      expect(result.current.isAddPlaylistModalOpen).toBe(true);

      act(() => {
        result.current.setIsAddPlaylistModalOpen(false);
      });
      expect(result.current.isAddPlaylistModalOpen).toBe(false);
    });
  });

  describe('Add channel modal', () => {
    it('should initialize closed', () => {
      const { result } = renderHook(() => useModals());
      expect(result.current.isAddChannelModalOpen).toBe(false);
    });

    it('should open and close modal', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.setIsAddChannelModalOpen(true);
      });
      expect(result.current.isAddChannelModalOpen).toBe(true);
    });
  });

  describe('Formula settings modal', () => {
    it('should initialize closed', () => {
      const { result } = renderHook(() => useModals());
      expect(result.current.isFormulaModalOpen).toBe(false);
    });

    it('should open modal', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.setIsFormulaModalOpen(true);
      });
      expect(result.current.isFormulaModalOpen).toBe(true);
    });
  });

  describe('Import playlists modal', () => {
    it('should initialize with no channel to import', () => {
      const { result } = renderHook(() => useModals());
      expect(result.current.channelToImport).toBeNull();
    });

    it('should set channel to import', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.setChannelToImport(mockChannel);
      });
      expect(result.current.channelToImport).toEqual(mockChannel);
    });
  });

  describe('History modal', () => {
    it('should initialize closed', () => {
      const { result } = renderHook(() => useModals());
      expect(result.current.isHistoryModalOpen).toBe(false);
    });

    it('should open history modal', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.setIsHistoryModalOpen(true);
      });
      expect(result.current.isHistoryModalOpen).toBe(true);
    });
  });

  describe('KinoRate modal', () => {
    it('should initialize closed with empty query', () => {
      const { result } = renderHook(() => useModals());
      expect(result.current.isKinoRateOpen).toBe(false);
      expect(result.current.kinoRateQuery).toBe('');
      expect(result.current.kinoRateContext).toBeNull();
    });

    it('should open KinoRate modal with query', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.openKinoRate('Test Movie 2024');
      });

      expect(result.current.isKinoRateOpen).toBe(true);
      expect(result.current.kinoRateQuery).toBe('Test Movie 2024');
      expect(result.current.kinoRateContext).toBe('Test Movie 2024');
    });

    it('should open KinoRate modal with empty query', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.openKinoRate();
      });

      expect(result.current.isKinoRateOpen).toBe(true);
      expect(result.current.kinoRateQuery).toBe('');
    });

    it('should close KinoRate modal', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.openKinoRate('Test');
      });
      expect(result.current.isKinoRateOpen).toBe(true);

      act(() => {
        result.current.setIsKinoRateOpen(false);
      });
      expect(result.current.isKinoRateOpen).toBe(false);
    });

    it('should update kinoRateQuery independently', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.setKinoRateQuery('New Query');
      });
      expect(result.current.kinoRateQuery).toBe('New Query');
    });

    it('should update kinoRateContext independently', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.setKinoRateContext('Context');
      });
      expect(result.current.kinoRateContext).toBe('Context');
    });
  });

  describe('Confirm modal', () => {
    it('should initialize closed with empty message', () => {
      const { result } = renderHook(() => useModals());
      expect(result.current.isConfirmModalOpen).toBe(false);
      expect(result.current.confirmMessage).toBe('');
    });

    it('should open confirm modal with message', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.setIsConfirmModalOpen(true);
        result.current.setConfirmMessage('Are you sure?');
      });

      expect(result.current.isConfirmModalOpen).toBe(true);
      expect(result.current.confirmMessage).toBe('Are you sure?');
    });
  });

  describe('Notification modal', () => {
    it('should initialize closed with empty message', () => {
      const { result } = renderHook(() => useModals());
      expect(result.current.isNotificationModalOpen).toBe(false);
      expect(result.current.notificationMessage).toBe('');
      expect(result.current.notificationType).toBe('info');
    });

    it('should show success notification', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.showNotification('Success!', 'success');
      });

      expect(result.current.isNotificationModalOpen).toBe(true);
      expect(result.current.notificationMessage).toBe('Success!');
      expect(result.current.notificationType).toBe('success');
    });

    it('should show error notification', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.showNotification('Error!', 'error');
      });

      expect(result.current.isNotificationModalOpen).toBe(true);
      expect(result.current.notificationMessage).toBe('Error!');
      expect(result.current.notificationType).toBe('error');
    });

    it('should show warning notification', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.showNotification('Warning!', 'warning');
      });

      expect(result.current.notificationType).toBe('warning');
    });

    it('should show info notification by default', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.showNotification('Info message');
      });

      expect(result.current.notificationType).toBe('info');
    });

    it('should close notification modal', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.showNotification('Test');
      });
      expect(result.current.isNotificationModalOpen).toBe(true);

      act(() => {
        result.current.setIsNotificationModalOpen(false);
      });
      expect(result.current.isNotificationModalOpen).toBe(false);
    });
  });

  describe('Multiple modals', () => {
    it('should manage multiple modals independently', () => {
      const { result } = renderHook(() => useModals());

      act(() => {
        result.current.setIsAddChannelModalOpen(true);
        result.current.setIsHistoryModalOpen(true);
        result.current.setIsFormulaModalOpen(true);
      });

      expect(result.current.isAddChannelModalOpen).toBe(true);
      expect(result.current.isHistoryModalOpen).toBe(true);
      expect(result.current.isFormulaModalOpen).toBe(true);

      act(() => {
        result.current.setIsAddChannelModalOpen(false);
      });

      expect(result.current.isAddChannelModalOpen).toBe(false);
      expect(result.current.isHistoryModalOpen).toBe(true);
      expect(result.current.isFormulaModalOpen).toBe(true);
    });
  });
});
