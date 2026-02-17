import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChannels } from '../../src/hooks/useChannels';
import { StorageService } from '../../src/services/storageService';
import { DEFAULT_CHANNELS } from '../../src/services/rutubeService';

vi.mock('../../src/services/storageService', () => ({
  StorageService: {
    getChannels: vi.fn(() => []),
    setChannels: vi.fn(),
    getActiveChannelId: vi.fn(() => ''),
    setActiveChannelId: vi.fn(),
    getAllPlaylists: vi.fn(() => ({})),
    setAllPlaylists: vi.fn(),
  },
}));

vi.mock('../../src/services/rutubeService', () => ({
  DEFAULT_CHANNELS: [
    { id: '1', label: 'Channel 1', rutubeId: '111', isSystem: true },
    { id: '2', label: 'Channel 2', rutubeId: '222', isSystem: true },
  ],
  DEFAULT_PLAYLISTS_BY_CHANNEL: {
    '111': [{ id: 'all-1', label: 'Все видео', rutubeId: '111', type: 'channel', isSystem: true }],
    '222': [{ id: 'all-2', label: 'Все видео', rutubeId: '222', type: 'channel', isSystem: true }],
  },
  fetchChannelInfo: vi.fn(),
  fetchChannelPlaylists: vi.fn(() => []),
}));

describe('useChannels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should load channels from storage', () => {
      const mockChannels = [
        { id: 'channel-1', label: 'Channel 1', rutubeId: '111', isSystem: true },
      ];
      vi.mocked(StorageService.getChannels).mockReturnValue(mockChannels);

      const { result } = renderHook(() => useChannels());

      expect(result.current.channels).toEqual(mockChannels);
    });

    it('should load active channel id from storage', () => {
      vi.mocked(StorageService.getChannels).mockReturnValue([
        { id: 'channel-1', label: 'Channel 1', rutubeId: '111', isSystem: true },
      ]);
      vi.mocked(StorageService.getActiveChannelId).mockReturnValue('channel-1');

      const { result } = renderHook(() => useChannels());

      expect(result.current.activeChannelId).toBe('channel-1');
    });

    it('should initialize with home view mode', () => {
      const { result } = renderHook(() => useChannels());

      expect(result.current.viewMode).toBe('home');
    });

    it('should load playlists from storage', () => {
      const mockPlaylists = {
        'channel-1': [{ id: 'pl-1', label: 'Playlist 1', rutubeId: '111', type: 'playlist' }],
      };
      vi.mocked(StorageService.getAllPlaylists).mockReturnValue(mockPlaylists);

      const { result } = renderHook(() => useChannels());

      expect(result.current.allPlaylists).toEqual(mockPlaylists);
    });
  });

  describe('handleChannelSelect', () => {
    it('should set active channel and switch to channel mode', () => {
      vi.mocked(StorageService.getChannels).mockReturnValue([
        { id: 'channel-1', label: 'Channel 1', rutubeId: '111', isSystem: true },
      ]);

      const { result } = renderHook(() => useChannels());

      act(() => {
        result.current.handleChannelSelect('channel-1');
      });

      expect(result.current.activeChannelId).toBe('channel-1');
      expect(result.current.viewMode).toBe('channel');
    });
  });

  describe('handleGoHome', () => {
    it('should switch to home mode and clear active channel', () => {
      vi.mocked(StorageService.getChannels).mockReturnValue([
        { id: 'channel-1', label: 'Channel 1', rutubeId: '111', isSystem: true },
      ]);
      vi.mocked(StorageService.getActiveChannelId).mockReturnValue('');

      const { result } = renderHook(() => useChannels());

      act(() => {
        result.current.handleChannelSelect('channel-1');
      });
      expect(result.current.viewMode).toBe('channel');

      act(() => {
        result.current.handleGoHome();
      });

      expect(result.current.viewMode).toBe('home');
    });
  });

  describe('handleAddChannel', () => {
    it('should add new channel to list', () => {
      vi.mocked(StorageService.getChannels).mockReturnValue([]);

      const { result } = renderHook(() => useChannels());

      act(() => {
        result.current.handleAddChannel('New Channel', '123456');
      });

      expect(result.current.channels).toHaveLength(1);
      expect(result.current.channels[0].label).toBe('New Channel');
      expect(result.current.channels[0].rutubeId).toBe('123456');
      expect(result.current.channels[0].isSystem).toBe(false);
    });

    it('should create default playlist for new channel', () => {
      const { result } = renderHook(() => useChannels());

      act(() => {
        result.current.handleAddChannel('New Channel', '123456');
      });

      const channelId = result.current.channels[0].id;
      expect(result.current.allPlaylists[channelId]).toBeDefined();
      expect(result.current.allPlaylists[channelId][0].label).toBe('Все видео');
      expect(result.current.allPlaylists[channelId][0].type).toBe('channel');
    });

    it('should select newly added channel', () => {
      const { result } = renderHook(() => useChannels());

      act(() => {
        result.current.handleAddChannel('New Channel', '123456');
      });

      expect(result.current.viewMode).toBe('channel');
      expect(result.current.activeChannelId).toBe(result.current.channels[0].id);
    });
  });

  describe('handleRenameChannel', () => {
    it('should rename channel', () => {
      const mockChannels = [
        { id: 'channel-1', label: 'Old Name', rutubeId: '111', isSystem: false },
      ];
      vi.mocked(StorageService.getChannels).mockReturnValue(mockChannels);

      const { result } = renderHook(() => useChannels());

      act(() => {
        result.current.handleRenameChannel('channel-1', 'New Name');
      });

      const channel = result.current.channels.find(c => c.id === 'channel-1');
      expect(channel?.label).toBe('New Name');
    });

    it('should not affect other channels', () => {
      const mockChannels = [
        { id: 'channel-1', label: 'Channel 1', rutubeId: '111', isSystem: false },
        { id: 'channel-2', label: 'Channel 2', rutubeId: '222', isSystem: false },
      ];
      vi.mocked(StorageService.getChannels).mockReturnValue(mockChannels);

      const { result } = renderHook(() => useChannels());

      act(() => {
        result.current.handleRenameChannel('channel-1', 'Renamed');
      });

      expect(result.current.channels[0].label).toBe('Renamed');
      expect(result.current.channels[1].label).toBe('Channel 2');
    });
  });

  describe('handleRemoveChannel', () => {
    it('should remove channel from list', () => {
      const mockChannels = [
        { id: 'channel-1', label: 'Channel 1', rutubeId: '111', isSystem: false },
        { id: 'channel-2', label: 'Channel 2', rutubeId: '222', isSystem: false },
      ];
      vi.mocked(StorageService.getChannels).mockReturnValue(mockChannels);

      const { result } = renderHook(() => useChannels());

      act(() => {
        result.current.handleRemoveChannel('channel-1');
      });

      expect(result.current.channels).toHaveLength(1);
      expect(result.current.channels[0].id).toBe('channel-2');
    });

    it('should remove channel playlists', () => {
      const mockPlaylists = {
        'channel-1': [{ id: 'pl-1', label: 'Playlist', rutubeId: '111', type: 'playlist' }],
        'channel-2': [{ id: 'pl-2', label: 'Playlist 2', rutubeId: '222', type: 'playlist' }],
      };
      vi.mocked(StorageService.getAllPlaylists).mockReturnValue(mockPlaylists);

      const { result } = renderHook(() => useChannels());

      act(() => {
        result.current.handleRemoveChannel('channel-1');
      });

      expect(result.current.allPlaylists['channel-1']).toBeUndefined();
      expect(result.current.allPlaylists['channel-2']).toBeDefined();
    });

    it('should go home if removed channel was active', () => {
      const mockChannels = [
        { id: 'channel-1', label: 'Channel 1', rutubeId: '111', isSystem: false },
      ];
      vi.mocked(StorageService.getChannels).mockReturnValue(mockChannels);
      vi.mocked(StorageService.getActiveChannelId).mockReturnValue('channel-1');

      const { result } = renderHook(() => useChannels());

      act(() => {
        result.current.handleChannelSelect('channel-1');
      });

      act(() => {
        result.current.handleRemoveChannel('channel-1');
      });

      expect(result.current.viewMode).toBe('home');
      expect(result.current.activeChannelId).toBe('');
    });
  });

  describe('activeChannel', () => {
    it('should return undefined when no channel is active', () => {
      vi.mocked(StorageService.getChannels).mockReturnValue([]);

      const { result } = renderHook(() => useChannels());

      expect(result.current.activeChannel).toBeUndefined();
    });

    it('should return active channel object', () => {
      const mockChannels = [
        { id: 'channel-1', label: 'Channel 1', rutubeId: '111', isSystem: true },
      ];
      vi.mocked(StorageService.getChannels).mockReturnValue(mockChannels);
      vi.mocked(StorageService.getActiveChannelId).mockReturnValue('channel-1');

      const { result } = renderHook(() => useChannels());

      expect(result.current.activeChannel).toEqual(mockChannels[0]);
    });
  });

  describe('currentChannelPlaylists', () => {
    it('should return empty array when no channel is active', () => {
      vi.mocked(StorageService.getChannels).mockReturnValue([]);

      const { result } = renderHook(() => useChannels());

      expect(result.current.currentChannelPlaylists).toEqual([]);
    });

    it('should return playlists for active channel', () => {
      const mockChannels = [
        { id: 'channel-1', label: 'Channel 1', rutubeId: '111', isSystem: true },
      ];
      const mockPlaylists = {
        'channel-1': [{ id: 'pl-1', label: 'Playlist 1', rutubeId: '111', type: 'channel' }],
      };
      vi.mocked(StorageService.getChannels).mockReturnValue(mockChannels);
      vi.mocked(StorageService.getActiveChannelId).mockReturnValue('channel-1');
      vi.mocked(StorageService.getAllPlaylists).mockReturnValue(mockPlaylists);

      const { result } = renderHook(() => useChannels());

      expect(result.current.currentChannelPlaylists).toEqual(mockPlaylists['channel-1']);
    });
  });

  describe('storage persistence', () => {
    it('should persist channels when they change', () => {
      const { result } = renderHook(() => useChannels());

      act(() => {
        result.current.handleAddChannel('New Channel', '123456');
      });

      expect(StorageService.setChannels).toHaveBeenCalled();
    });

    it('should persist active channel id when it changes', () => {
      const { result } = renderHook(() => useChannels());

      act(() => {
        result.current.handleChannelSelect('channel-1');
      });

      expect(StorageService.setActiveChannelId).toHaveBeenCalledWith('channel-1');
    });

    it('should persist playlists when they change', () => {
      const { result } = renderHook(() => useChannels());

      act(() => {
        result.current.handleAddChannel('New Channel', '123456');
      });

      expect(StorageService.setAllPlaylists).toHaveBeenCalled();
    });
  });

  describe('auto-selection of first channel', () => {
    it('should auto-select first channel if active channel is not in list', () => {
      const mockChannels = [
        { id: 'channel-1', label: 'Channel 1', rutubeId: '111', isSystem: true },
      ];
      vi.mocked(StorageService.getChannels).mockReturnValue(mockChannels);
      vi.mocked(StorageService.getActiveChannelId).mockReturnValue('non-existent');

      const { result } = renderHook(() => useChannels());

      expect(result.current.activeChannelId).toBe('channel-1');
    });

    it('should clear active channel id when channels list is empty', () => {
      vi.mocked(StorageService.getChannels).mockReturnValue([]);
      vi.mocked(StorageService.getActiveChannelId).mockReturnValue('channel-1');

      const { result } = renderHook(() => useChannels());

      expect(result.current.activeChannelId).toBe('');
    });
  });
});
