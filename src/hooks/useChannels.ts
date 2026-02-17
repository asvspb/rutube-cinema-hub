import { useState, useEffect, useMemo, useCallback } from 'react';
import { StorageService } from '../services/storageService';
import {
  DEFAULT_CHANNELS,
  fetchChannelInfo,
  fetchChannelPlaylists,
} from '../services/rutubeService';
import { ChannelDef, CategoryDef, ChannelInfo, RatingSettings } from '../types';

interface UseChannelsResult {
  channels: ChannelDef[];
  setChannels: React.Dispatch<React.SetStateAction<ChannelDef[]>>;
  activeChannelId: string;
  setActiveChannelId: React.Dispatch<React.SetStateAction<string>>;
  viewMode: 'home' | 'channel';
  setViewMode: React.Dispatch<React.SetStateAction<'home' | 'channel'>>;
  activeChannel: ChannelDef | undefined;
  handleChannelSelect: (channelId: string) => void;
  handleGoHome: () => void;
  handleAddChannel: (name: string, rutubeId: string) => void;
  handleRenameChannel: (channelId: string, newName: string) => void;
  handleRemoveChannel: (channelId: string) => void;
  channelInfo: ChannelInfo | null;
  setChannelInfo: React.Dispatch<React.SetStateAction<ChannelInfo | null>>;
  isChannelLoading: boolean;
  setIsChannelLoading: React.Dispatch<React.SetStateAction<boolean>>;
  currentChannelPlaylists: CategoryDef[];
  allPlaylists: Record<string, CategoryDef[]>;
  setAllPlaylists: React.Dispatch<React.SetStateAction<Record<string, CategoryDef[]>>>;
  channelAvailablePlaylists: CategoryDef[];
  setChannelAvailablePlaylists: React.Dispatch<React.SetStateAction<CategoryDef[]>>;
  refreshChannelData: () => void;
}

export const useChannels = (): UseChannelsResult => {
  const [channels, setChannels] = useState<ChannelDef[]>(() => StorageService.getChannels());
  const [activeChannelId, setActiveChannelId] = useState<string>(() =>
    StorageService.getActiveChannelId()
  );
  const [viewMode, setViewMode] = useState<'home' | 'channel'>('home');
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [isChannelLoading, setIsChannelLoading] = useState(false);
  const [allPlaylists, setAllPlaylists] = useState<Record<string, CategoryDef[]>>(() =>
    StorageService.getAllPlaylists()
  );
  const [channelAvailablePlaylists, setChannelAvailablePlaylists] = useState<CategoryDef[]>([]);

  // Update active channel ID when channels change
  useEffect(() => {
    if (channels.length > 0 && !channels.find(c => c.id === activeChannelId)) {
      setActiveChannelId(channels[0].id);
    } else if (channels.length === 0 && activeChannelId !== '') {
      setActiveChannelId('');
    }
  }, [channels, activeChannelId]);

  // Save active channel ID to storage when it changes
  useEffect(() => {
    StorageService.setActiveChannelId(activeChannelId);
  }, [activeChannelId]);

  // Save channels to storage when they change
  useEffect(() => {
    StorageService.setChannels(channels);
  }, [channels]);

  // Save playlists to storage when they change
  useEffect(() => {
    StorageService.setAllPlaylists(allPlaylists);
  }, [allPlaylists]);

  const activeChannel = useMemo(() => {
    return channels.find(c => c.id === activeChannelId);
  }, [channels, activeChannelId]);

  const currentChannelPlaylists = useMemo(() => {
    const list = allPlaylists[activeChannelId] || [];
    if (list.length === 0) {
      const channel = channels.find(c => c.id === activeChannelId);
      if (channel && allPlaylists[channel.rutubeId]) {
        return allPlaylists[channel.rutubeId];
      }
    }
    return list;
  }, [allPlaylists, activeChannelId, channels]);

  const handleChannelSelect = (channelId: string) => {
    setActiveChannelId(channelId);
    setViewMode('channel');
  };

  const handleGoHome = () => {
    setViewMode('home');
    setActiveChannelId('');
  };

  const handleAddChannel = (name: string, rutubeId: string) => {
    const newChannelId = `channel-${rutubeId}-${Date.now()}`;
    const newChannel: ChannelDef = {
      id: newChannelId,
      label: name,
      rutubeId,
      isSystem: false,
    };

    const initialPlaylists: CategoryDef[] = [
      {
        id: `all-${newChannelId}`,
        label: 'Все видео',
        rutubeId: rutubeId,
        type: 'channel',
        isSystem: true,
      },
    ];

    setChannels(prev => [...prev, newChannel]);
    setAllPlaylists(prev => ({
      ...prev,
      [newChannelId]: initialPlaylists,
    }));
    handleChannelSelect(newChannelId);
  };

  const handleRenameChannel = (channelId: string, newName: string) => {
    setChannels(prev => prev.map(c => (c.id === channelId ? { ...c, label: newName } : c)));
  };

  const handleRemoveChannel = (channelId: string) => {
    const newChannels = channels.filter(c => c.id !== channelId);
    setChannels(newChannels);

    setAllPlaylists(prev => {
      const next = { ...prev };
      delete next[channelId];
      return next;
    });

    if (activeChannelId === channelId) {
      setViewMode('home');
      setActiveChannelId('');
    }
  };

  const refreshChannelData = useCallback(async () => {
    if (viewMode === 'home') return;

    // Use functional update to get current channel
    let channel: ChannelDef | undefined;
    setChannels(prev => {
      channel = prev.find(c => c.id === activeChannelId);
      return prev;
    });

    if (!channel) return;

    setIsChannelLoading(true);

    try {
      const [info, fetchedPlaylists] = await Promise.all([
        fetchChannelInfo(channel.rutubeId),
        fetchChannelPlaylists(channel.rutubeId),
      ]);

      setChannelInfo(
        info || {
          title: channel!.label,
          subscribers: '0',
          avatarUrl: '',
          bannerUrl: '',
        }
      );

      setChannelAvailablePlaylists(fetchedPlaylists);

      setAllPlaylists(prev => {
        const currentList = prev[activeChannelId] || [];
        // Fix: use prev instead of allPlaylists to avoid stale closure
        const listToUpdate = currentList.length > 0 ? currentList : prev[channel!.rutubeId] || [];

        const updatedList = listToUpdate.map(cat => {
          if (cat.isSystem && cat.type === 'channel' && info?.videoCount) {
            return { ...cat, itemCount: info.videoCount };
          }
          if (cat.type === 'playlist') {
            const found = fetchedPlaylists.find(fp => fp.rutubeId === cat.rutubeId);
            if (found && found.itemCount !== undefined) {
              return { ...cat, itemCount: found.itemCount };
            }
          }
          return cat;
        });

        return {
          ...prev,
          [activeChannelId]: updatedList,
        };
      });
    } catch (e) {
      console.error('Failed to fetch channel data', e);
      setChannelInfo({
        title: channel!.label,
        subscribers: '0',
        avatarUrl: '',
        bannerUrl: '',
      });
    } finally {
      setIsChannelLoading(false);
    }
  }, [viewMode, activeChannelId]);

  return {
    channels,
    setChannels,
    activeChannelId,
    setActiveChannelId,
    viewMode,
    setViewMode,
    activeChannel,
    handleChannelSelect,
    handleGoHome,
    handleAddChannel,
    handleRenameChannel,
    handleRemoveChannel,
    channelInfo,
    setChannelInfo,
    isChannelLoading,
    setIsChannelLoading,
    currentChannelPlaylists,
    allPlaylists,
    setAllPlaylists,
    channelAvailablePlaylists,
    setChannelAvailablePlaylists,
    refreshChannelData,
  };
};
